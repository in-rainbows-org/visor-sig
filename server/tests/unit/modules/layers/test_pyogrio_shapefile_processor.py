import io
import os
import zipfile
import pytest

from app.modules.layers.domain.exceptions import (
    IncompatibleGeometryTypeException,
    InvalidCoordinateReferenceSystemException,
    InvalidShapefilePackageException,
)
from app.modules.layers.infrastructure.processing.pyogrio_shapefile_processor import (
    PyogrioShapefileProcessor,
)

FIXTURE_DIR = "venv/lib/python3.14/site-packages/pyogrio/tests/fixtures/naturalearth_lowres"

WKT_3857 = (
    'PROJCS["WGS_1984_Web_Mercator_Auxiliary_Sphere",'
    'GEOGCS["GCS_WGS_1984",DATUM["D_WGS_1984",SPHEROID["WGS_1984",6378137.0,298.257223563]],'
    'PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]],'
    'PROJECTION["Mercator_Auxiliary_Sphere"],PARAMETER["False_Easting",0.0],'
    'PARAMETER["False_Northing",0.0],PARAMETER["Central_Meridian",0.0],'
    'PARAMETER["Standard_Parallel_1",0.0],PARAMETER["Auxiliary_Sphere_Type",0.0],UNIT["Meter",1.0]]'
)


def _build_zip(exclude_extensions: list[str] | None = None, prj_content: str | None = None) -> bytes:
    exclude = set(exclude_extensions or [])
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w") as zf:
        for fname in os.listdir(FIXTURE_DIR):
            ext = os.path.splitext(fname)[1]
            if ext in exclude:
                continue
            file_path = os.path.join(FIXTURE_DIR, fname)
            if ext == ".prj" and prj_content is not None:
                zf.writestr(fname, prj_content)
            else:
                zf.write(file_path, arcname=fname)
    return buf.getvalue()


class TestPyogrioShapefileProcessor:
    @pytest.fixture
    def processor(self) -> PyogrioShapefileProcessor:
        return PyogrioShapefileProcessor()

    def test_process_valid_shapefile_zip(self, processor: PyogrioShapefileProcessor):
        zip_bytes = _build_zip()
        result = processor.process_zip(zip_bytes, "POLYGON")

        assert result.feature_count == 177
        assert result.source_dataset_name == "naturalearth_lowres"
        assert len(result.features) == 177

        first_feature = result.features[0]
        assert isinstance(first_feature.geometry_wkb, bytes)
        assert len(first_feature.geometry_wkb) > 0
        assert "name" in first_feature.properties
        assert first_feature.properties["name"] == "Fiji"

    def test_process_missing_required_component(self, processor: PyogrioShapefileProcessor):
        # Excluir archivo .shx
        zip_bytes = _build_zip(exclude_extensions=[".shx"])
        with pytest.raises(InvalidShapefilePackageException) as exc_info:
            processor.process_zip(zip_bytes, "POLYGON")
        assert ".shx" in str(exc_info.value)

    def test_process_no_shp_file(self, processor: PyogrioShapefileProcessor):
        buf = io.BytesIO()
        with zipfile.ZipFile(buf, "w") as zf:
            zf.writestr("dummy.txt", "not a shapefile")
        with pytest.raises(InvalidShapefilePackageException):
            processor.process_zip(buf.getvalue(), "POLYGON")

    def test_process_multiple_shp_files(self, processor: PyogrioShapefileProcessor):
        buf = io.BytesIO()
        with zipfile.ZipFile(buf, "w") as zf:
            for fname in os.listdir(FIXTURE_DIR):
                file_path = os.path.join(FIXTURE_DIR, fname)
                zf.write(file_path, arcname=fname)
                # Duplicar con otro dataset
                zf.write(file_path, arcname=f"copy_{fname}")
        with pytest.raises(InvalidShapefilePackageException) as exc_info:
            processor.process_zip(buf.getvalue(), "POLYGON")
        assert "exactamente un dataset" in str(exc_info.value)

    def test_process_corrupt_zip(self, processor: PyogrioShapefileProcessor):
        with pytest.raises(InvalidShapefilePackageException) as exc_info:
            processor.process_zip(b"not-a-valid-zip-content", "POLYGON")
        assert "no es un archivo ZIP válido" in str(exc_info.value)

    def test_process_zip_traversal(self, processor: PyogrioShapefileProcessor):
        buf = io.BytesIO()
        with zipfile.ZipFile(buf, "w") as zf:
            zf.writestr("../etc/passwd", "malicious")
        with pytest.raises(InvalidShapefilePackageException) as exc_info:
            processor.process_zip(buf.getvalue(), "POLYGON")
        assert "Ruta insegura" in str(exc_info.value)

    def test_process_zip_absolute_path(self, processor: PyogrioShapefileProcessor):
        buf = io.BytesIO()
        with zipfile.ZipFile(buf, "w") as zf:
            zf.writestr("/root/test.shp", "malicious")
        with pytest.raises(InvalidShapefilePackageException) as exc_info:
            processor.process_zip(buf.getvalue(), "POLYGON")
        assert "Ruta insegura" in str(exc_info.value)

    def test_process_encrypted_zip(self, processor: PyogrioShapefileProcessor):
        buf = io.BytesIO()
        with zipfile.ZipFile(buf, "w") as zf:
            zf.writestr("test.shp", b"data")
        raw = bytearray(buf.getvalue())
        cd_sig = b"PK\x01\x02"
        idx = raw.find(cd_sig)
        raw[idx + 8] = raw[idx + 8] | 0x01  # set encryption bit in central directory
        with pytest.raises(InvalidShapefilePackageException) as exc_info:
            processor.process_zip(bytes(raw), "POLYGON")
        assert "protegido por contraseña" in str(exc_info.value)

    def test_process_size_limit_exceeded(self, processor: PyogrioShapefileProcessor):
        oversized = b"0" * (100 * 1024 * 1024 + 1)
        with pytest.raises(InvalidShapefilePackageException) as exc_info:
            processor.process_zip(oversized, "POLYGON")
        assert "100 MB" in str(exc_info.value)

    def test_process_invalid_crs(self, processor: PyogrioShapefileProcessor):
        zip_bytes = _build_zip(prj_content=WKT_3857)
        with pytest.raises(InvalidCoordinateReferenceSystemException) as exc_info:
            processor.process_zip(zip_bytes, "POLYGON")
        assert "EPSG:4326" in str(exc_info.value)

    def test_process_incompatible_geometry_type(self, processor: PyogrioShapefileProcessor):
        zip_bytes = _build_zip()
        # Capa configurada como POINT pero dataset es POLYGON
        with pytest.raises(IncompatibleGeometryTypeException) as exc_info:
            processor.process_zip(zip_bytes, "POINT")
        assert "no coincide con el tipo de geometría configurado" in str(exc_info.value)
