import io
import os
import tempfile
import zipfile
import numpy as np
import pyogrio.raw as raw
import shapely.geometry


def build_lotes_zip(count: int = 5) -> bytes:
    """Crea un ZIP válido en memoria con shapefile de Lotes (Polygon, EPSG:4326, Id, NroLote)."""
    geoms = []
    ids = []
    nros = []
    for i in range(count):
        poly = shapely.geometry.Polygon([(i, i), (i + 1, i), (i + 1, i + 1), (i, i + 1), (i, i)])
        geoms.append(poly.wkb)
        ids.append(i + 1)
        nros.append(f"L-{i+1}")

    with tempfile.TemporaryDirectory() as tmpdir:
        shp_path = os.path.join(tmpdir, "lotes.shp")
        raw.write(
            shp_path,
            geometry=np.array(geoms, dtype=object),
            field_data=[np.array(ids), np.array(nros, dtype=object)],
            fields=["Id", "NroLote"],
            geometry_type="Polygon",
            crs="EPSG:4326",
        )
        buf = io.BytesIO()
        with zipfile.ZipFile(buf, "w") as zf:
            for fname in os.listdir(tmpdir):
                zf.write(os.path.join(tmpdir, fname), arcname=fname)
        return buf.getvalue()


def build_codigos_fijos_zip(count: int = 5) -> bytes:
    """Crea un ZIP válido en memoria con shapefile de Códigos Fijos (Point, EPSG:4326, CodF_SQL, CodF_SIG, CodFijo, Nombre)."""
    geoms = []
    sql_codes = []
    sig_codes = []
    fixed_codes = []
    names = []
    for i in range(count):
        pt = shapely.geometry.Point(-63.18 + i * 0.001, -17.78 + i * 0.001)
        geoms.append(pt.wkb)
        sql_codes.append(1000 + i)
        sig_codes.append(f"SIG-{i+1}")
        fixed_codes.append(2000 + i)
        names.append(f"Usuario-{i+1}")

    with tempfile.TemporaryDirectory() as tmpdir:
        shp_path = os.path.join(tmpdir, "codigos_fijos.shp")
        raw.write(
            shp_path,
            geometry=np.array(geoms, dtype=object),
            field_data=[
                np.array(sql_codes),
                np.array(sig_codes, dtype=object),
                np.array(fixed_codes),
                np.array(names, dtype=object),
            ],
            fields=["CodF_SQL", "CodF_SIG", "CodFijo", "Nombre"],
            geometry_type="Point",
            crs="EPSG:4326",
        )
        buf = io.BytesIO()
        with zipfile.ZipFile(buf, "w") as zf:
            for fname in os.listdir(tmpdir):
                zf.write(os.path.join(tmpdir, fname), arcname=fname)
        return buf.getvalue()


def build_manzanas_zip(count: int = 5) -> bytes:
    """Crea un ZIP válido en memoria con shapefile de Manzanas (Polygon, EPSG:4326, Id, UV_MZA, UV, MZA)."""
    geoms = []
    ids = []
    uv_mzas = []
    uvs = []
    mzas = []
    for i in range(count):
        poly = shapely.geometry.Polygon([(i * 2, i * 2), (i * 2 + 1, i * 2), (i * 2 + 1, i * 2 + 1), (i * 2, i * 2 + 1), (i * 2, i * 2)])
        geoms.append(poly.wkb)
        ids.append(i + 1)
        uv_mzas.append(f"UV1_M{i+1}")
        uvs.append("UV1")
        mzas.append(f"M{i+1}")

    with tempfile.TemporaryDirectory() as tmpdir:
        shp_path = os.path.join(tmpdir, "manzanas.shp")
        raw.write(
            shp_path,
            geometry=np.array(geoms, dtype=object),
            field_data=[
                np.array(ids),
                np.array(uv_mzas, dtype=object),
                np.array(uvs, dtype=object),
                np.array(mzas, dtype=object),
            ],
            fields=["Id", "UV_MZA", "UV", "MZA"],
            geometry_type="Polygon",
            crs="EPSG:4326",
        )
        buf = io.BytesIO()
        with zipfile.ZipFile(buf, "w") as zf:
            for fname in os.listdir(tmpdir):
                zf.write(os.path.join(tmpdir, fname), arcname=fname)
        return buf.getvalue()


def build_vias_zip(count: int = 5) -> bytes:
    """Crea un ZIP válido en memoria con shapefile de Vías (LineString, EPSG:4326, osm_id, name, type)."""
    geoms = []
    osm_ids = []
    names = []
    road_types = []
    for i in range(count):
        line = shapely.geometry.LineString([(i, i), (i + 1, i + 1)])
        geoms.append(line.wkb)
        osm_ids.append(100000 + i)
        names.append(f"Calle {i+1}")
        road_types.append("residential")

    with tempfile.TemporaryDirectory() as tmpdir:
        shp_path = os.path.join(tmpdir, "vias.shp")
        raw.write(
            shp_path,
            geometry=np.array(geoms, dtype=object),
            field_data=[
                np.array(osm_ids),
                np.array(names, dtype=object),
                np.array(road_types, dtype=object),
            ],
            fields=["osm_id", "name", "type"],
            geometry_type="LineString",
            crs="EPSG:4326",
        )
        buf = io.BytesIO()
        with zipfile.ZipFile(buf, "w") as zf:
            for fname in os.listdir(tmpdir):
                zf.write(os.path.join(tmpdir, fname), arcname=fname)
        return buf.getvalue()
