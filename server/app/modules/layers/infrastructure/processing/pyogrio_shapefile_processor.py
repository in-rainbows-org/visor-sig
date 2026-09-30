import datetime
import io
import os
import tempfile
import zipfile
from pathlib import Path
from typing import Any

import numpy as np
import pyogrio
import pyogrio.raw
import pyproj
import shapely
import shapely.wkb

from app.modules.layers.application.ports.providers.shapefile_processor import (
    ParsedFeature,
    ShapefileProcessResult,
    ShapefileProcessor,
)
from app.modules.layers.domain.exceptions import (
    IncompatibleGeometryTypeException,
    InvalidCoordinateReferenceSystemException,
    InvalidShapefilePackageException,
)

GEOMETRY_FAMILIES: dict[str, set[str]] = {
    "POINT": {"Point", "MultiPoint"},
    "LINE": {"LineString", "MultiLineString"},
    "POLYGON": {"Polygon", "MultiPolygon"},
}

MAX_COMPRESSED_SIZE_BYTES = 100 * 1024 * 1024  # 100 MB
MAX_UNCOMPRESSED_SIZE_BYTES = 500 * 1024 * 1024  # 500 MB
REQUIRED_EXTENSIONS = {".shp", ".shx", ".dbf", ".prj"}


def clean_json_value(val: Any) -> Any:
    """Normaliza tipos de datos de DBF a tipos serializables en JSON/JSONB."""
    if val is None:
        return None
    if isinstance(val, (datetime.date, datetime.datetime)):
        return val.isoformat()
    if hasattr(val, "item"):
        val = val.item()
    if isinstance(val, float):
        if np.isnan(val) or np.isinf(val):
            return None
        return float(val)
    if isinstance(val, (int, np.integer)):
        return int(val)
    if isinstance(val, (bool, np.bool_)):
        return bool(val)
    if isinstance(val, bytes):
        return val.decode("utf-8", errors="replace")
    if isinstance(val, (str, dict, list)):
        return val
    return str(val)


class PyogrioShapefileProcessor(ShapefileProcessor):
    """
    Adaptador de infraestructura para la descompresión segura y procesamiento
    de Shapefiles mediante pyogrio, Shapely y pyproj.
    """

    def process_zip(
        self,
        zip_bytes: bytes,
        target_geometry_type: str,
    ) -> ShapefileProcessResult:
        if len(zip_bytes) > MAX_COMPRESSED_SIZE_BYTES:
            raise InvalidShapefilePackageException(
                "El archivo excede el tamaño máximo permitido de 100 MB."
            )

        try:
            zf = zipfile.ZipFile(io.BytesIO(zip_bytes))
        except zipfile.BadZipFile:
            raise InvalidShapefilePackageException(
                "El archivo proporcionado no es un archivo ZIP válido o está dañado."
            )

        with zf:
            total_uncompressed = 0
            for info in zf.infolist():
                if info.flag_bits & 0x1:
                    raise InvalidShapefilePackageException(
                        "El archivo ZIP no puede estar protegido por contraseña."
                    )

                filename = info.filename
                if filename.startswith("/") or filename.startswith("\\"):
                    raise InvalidShapefilePackageException(
                        "Ruta insegura detectada en el archivo ZIP."
                    )
                parts = filename.replace("\\", "/").split("/")
                if ".." in parts:
                    raise InvalidShapefilePackageException(
                        "Ruta insegura detectada en el archivo ZIP."
                    )

                total_uncompressed += info.file_size
                if total_uncompressed > MAX_UNCOMPRESSED_SIZE_BYTES:
                    raise InvalidShapefilePackageException(
                        "El contenido descomprimido del archivo ZIP excede el límite permitido."
                    )

            # Filtrar entradas que no sean metadatos de sistema operativo
            valid_entries = [
                info
                for info in zf.infolist()
                if not info.is_dir()
                and not info.filename.startswith("__MACOSX/")
                and not os.path.basename(info.filename).startswith("._")
                and os.path.basename(info.filename) != ".DS_Store"
            ]

            # Buscar archivos .shp
            shp_entries = [
                info for info in valid_entries if info.filename.lower().endswith(".shp")
            ]
            if not shp_entries:
                raise InvalidShapefilePackageException(
                    "El archivo ZIP no contiene un conjunto de Shapefile válido (.shp, .shx, .dbf, .prj)."
                )
            if len(shp_entries) > 1:
                raise InvalidShapefilePackageException(
                    "El archivo ZIP debe contener exactamente un dataset Shapefile."
                )

            shp_entry = shp_entries[0]
            shp_path_obj = Path(shp_entry.filename)
            base_dir = shp_path_obj.parent
            base_stem = shp_path_obj.stem
            base_stem_lower = base_stem.lower()

            # Localizar extensiones requeridas con el mismo nombre base en el mismo directorio
            dir_files = [info for info in valid_entries if Path(info.filename).parent == base_dir]
            ext_map: dict[str, zipfile.ZipInfo] = {}
            for info in dir_files:
                p = Path(info.filename)
                if p.stem.lower() == base_stem_lower:
                    ext_map[p.suffix.lower()] = info

            missing_extensions = REQUIRED_EXTENSIONS - set(ext_map.keys())
            if missing_extensions:
                formatted_missing = ", ".join(sorted(missing_extensions))
                raise InvalidShapefilePackageException(
                    f"Faltan archivos obligatorios para el dataset Shapefile: {formatted_missing}."
                )

            # Extraer a directorio temporal
            with tempfile.TemporaryDirectory() as temp_dir:
                for entry in valid_entries:
                    target_path = os.path.abspath(os.path.join(temp_dir, entry.filename))
                    if not target_path.startswith(os.path.abspath(temp_dir)):
                        raise InvalidShapefilePackageException(
                            "Ruta insegura detectada en el archivo ZIP."
                        )
                    os.makedirs(os.path.dirname(target_path), exist_ok=True)
                    with zf.open(entry) as src, open(target_path, "wb") as dst:
                        dst.write(src.read())

                extracted_shp = os.path.join(temp_dir, shp_entry.filename)
                extracted_prj = os.path.join(temp_dir, ext_map[".prj"].filename)

                # Validar CRS EPSG:4326
                self._validate_crs(extracted_shp, extracted_prj)

                # Leer dataset con pyogrio.raw y procesar entidades
                return self._parse_features(extracted_shp, base_stem, target_geometry_type)

    def _validate_crs(self, shp_path: str, prj_path: str) -> None:
        try:
            with open(prj_path, "r", encoding="utf-8", errors="ignore") as f:
                prj_wkt = f.read().strip()
        except Exception:
            prj_wkt = ""

        if not prj_wkt:
            raise InvalidCoordinateReferenceSystemException(
                "El archivo .prj no contiene una definición válida de CRS."
            )

        crs = None
        try:
            crs = pyproj.CRS.from_user_input(prj_wkt)
        except Exception:
            try:
                info = pyogrio.read_info(shp_path)
                if info.get("crs"):
                    crs = pyproj.CRS.from_user_input(info["crs"])
            except Exception:
                pass

        if crs is None:
            raise InvalidCoordinateReferenceSystemException(
                "No se pudo interpretar el sistema de referencia espacial (.prj)."
            )

        is_4326 = False
        try:
            if crs.to_epsg() == 4326:
                is_4326 = True
        except Exception:
            pass

        if not is_4326:
            auth = crs.to_authority()
            if auth and auth[0] == "EPSG" and str(auth[1]) == "4326":
                is_4326 = True

        if not is_4326:
            raise InvalidCoordinateReferenceSystemException(
                "El sistema de referencia espacial (CRS) debe ser EPSG:4326 (WGS84)."
            )

    def _parse_features(
        self,
        shp_path: str,
        source_dataset_name: str,
        target_geometry_type: str,
    ) -> ShapefileProcessResult:
        normalized_target_type = target_geometry_type.upper()
        target_family = GEOMETRY_FAMILIES.get(normalized_target_type)
        if target_family is None:
            raise IncompatibleGeometryTypeException(
                f"Tipo de geometría '{target_geometry_type}' desconocido."
            )

        try:
            meta, index, geometries, fields = pyogrio.raw.read(shp_path)
        except Exception as exc:
            raise InvalidShapefilePackageException(
                f"No se pudo leer el archivo Shapefile: {exc}"
            ) from exc

        num_features = len(geometries)
        if num_features == 0:
            layer_geom = meta.get("geometry_type")
            if layer_geom and layer_geom not in target_family:
                raise IncompatibleGeometryTypeException(
                    f"La geometría de las entidades ({layer_geom}) no coincide con el tipo de geometría configurado en la capa ({normalized_target_type})."
                )
            return ShapefileProcessResult(
                features=[],
                source_dataset_name=source_dataset_name,
            )

        field_names = [str(f) for f in meta.get("fields", [])]
        parsed_features: list[ParsedFeature] = []

        for i in range(num_features):
            geom_bytes = geometries[i]
            if geom_bytes is None:
                raise InvalidShapefilePackageException(
                    "Se detectaron geometrías nulas en el archivo Shapefile."
                )

            try:
                geom = shapely.from_wkb(geom_bytes)
            except Exception as exc:
                raise InvalidShapefilePackageException(
                    f"Geometría corrupta o ilegible en la entidad {i + 1}."
                ) from exc

            if geom.is_empty:
                raise InvalidShapefilePackageException(
                    f"Se detectó una geometría vacía en la entidad {i + 1}."
                )

            # Auto-reparación topológica preventiva (make_valid)
            if not geom.is_valid:
                try:
                    geom = shapely.make_valid(geom)
                except Exception as exc:
                    raise InvalidShapefilePackageException(
                        f"Se detectó una geometría topológicamente inválida en la entidad {i + 1} que no pudo ser reparada automáticamente."
                    ) from exc

            if geom is None or geom.is_empty:
                raise InvalidShapefilePackageException(
                    f"Se detectó una geometría vacía en la entidad {i + 1}."
                )

            # Si make_valid genera una GeometryCollection, extraer sólo las sub-geometrías de la familia objetivo
            if geom.geom_type == "GeometryCollection":
                sub_geoms = [g for g in geom.geoms if g.geom_type in target_family]
                if not sub_geoms:
                    raise IncompatibleGeometryTypeException(
                        f"La geometría de la entidad {i + 1} tras la corrección no contiene geometrías compatibles con ({normalized_target_type})."
                    )
                if normalized_target_type == "POLYGON":
                    polys = []
                    for g in sub_geoms:
                        if g.geom_type == "Polygon":
                            polys.append(g)
                        elif g.geom_type == "MultiPolygon":
                            polys.extend(g.geoms)
                    geom = shapely.multipolygons(polys) if len(polys) > 1 else polys[0]
                elif normalized_target_type == "LINE":
                    lines = []
                    for g in sub_geoms:
                        if g.geom_type == "LineString":
                            lines.append(g)
                        elif g.geom_type == "MultiLineString":
                            lines.extend(g.geoms)
                    geom = shapely.multilinestrings(lines) if len(lines) > 1 else lines[0]
                elif normalized_target_type == "POINT":
                    points = []
                    for g in sub_geoms:
                        if g.geom_type == "Point":
                            points.append(g)
                        elif g.geom_type == "MultiPoint":
                            points.extend(g.geoms)
                    geom = shapely.multipoints(points) if len(points) > 1 else points[0]

            if not geom.is_valid:
                raise InvalidShapefilePackageException(
                    f"Se detectó una geometría topológicamente inválida en la entidad {i + 1}."
                )

            if geom.geom_type not in target_family:
                raise IncompatibleGeometryTypeException(
                    f"La geometría de las entidades ({geom.geom_type}) no coincide con el tipo de geometría configurado en la capa ({normalized_target_type})."
                )

            geom_2d = shapely.force_2d(geom)
            wkb_2d = shapely.wkb.dumps(geom_2d)

            props: dict[str, Any] = {}
            for col_idx, field_name in enumerate(field_names):
                raw_val = fields[col_idx][i]
                props[field_name] = clean_json_value(raw_val)

            fid = (
                str(index[i])
                if index is not None and i < len(index) and index[i] is not None
                else None
            )
            parsed_features.append(
                ParsedFeature(
                    geometry_wkb=wkb_2d,
                    properties=props,
                    source_feature_id=fid,
                )
            )

        return ShapefileProcessResult(
            features=parsed_features,
            source_dataset_name=source_dataset_name,
        )
