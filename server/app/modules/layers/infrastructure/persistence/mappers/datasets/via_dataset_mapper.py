import uuid
from datetime import datetime, timezone
from typing import Any

import shapely
import shapely.wkb
from app.modules.layers.application.ports.providers.shapefile_processor import (
    ParsedFeature,
)
from app.modules.layers.domain.exceptions import InvalidShapefilePackageException
from app.modules.layers.infrastructure.persistence.models.via_model import ViaModel
from geoalchemy2.shape import from_shape


def _get_prop(props: dict[str, Any], *keys: str) -> Any:
    lower_map = {k.lower(): v for k, v in props.items()}
    for key in keys:
        val = lower_map.get(key.lower())
        if val is not None:
            return val
    return None


def _to_bool(val: Any) -> bool | None:
    if val is None:
        return None
    if isinstance(val, bool):
        return val
    if isinstance(val, (int, float)):
        return bool(val)
    if isinstance(val, str):
        return val.strip().lower() in {"1", "true", "t", "yes", "y", "si"}
    return None


def _to_int(val: Any) -> int | None:
    if val is None:
        return None
    try:
        return int(float(val))
    except (ValueError, TypeError):
        return None


class ViaDatasetMapper:
    """Mapper para transformar entidades parsed de Shapefile a ViaModel."""

    @classmethod
    def validate_properties(cls, sample_properties: dict[str, Any]) -> None:
        lower_props = {k.lower() for k in sample_properties.keys()}
        has_id = any(k in lower_props for k in ["osm_id", "osmid", "objectid", "id"])
        has_name_or_type = any(k in lower_props for k in ["name", "nombre", "type", "highway", "ref"])
        if not (has_id and has_name_or_type):
            raise InvalidShapefilePackageException(
                "El archivo Shapefile no contiene las columnas identificadoras mínimas para Vías (osm_id/objectid y name/type/highway)."
            )

    @classmethod
    def to_model(cls, feature: ParsedFeature, data_version_id: uuid.UUID) -> ViaModel:
        props = feature.properties
        geom = shapely.from_wkb(feature.geometry_wkb)

        # Asegurar MultiLineString
        if geom.geom_type == "LineString":
            multi_geom = shapely.multilinestrings([geom])
        elif geom.geom_type == "MultiLineString":
            multi_geom = geom
        else:
            raise InvalidShapefilePackageException(
                f"Geometría incompatible para Vías: se esperaba LineString o MultiLineString, se obtuvo '{geom.geom_type}'."
            )

        osm_id_val = _get_prop(props, "osm_id")
        name_val = _get_prop(props, "name")
        ref_val = _get_prop(props, "ref")
        road_type_val = _get_prop(props, "type")
        oneway_val = _get_prop(props, "oneway")
        bridge_val = _get_prop(props, "bridge")
        maxspeed_val = _get_prop(props, "maxspeed")
        object_id_val = _get_prop(props, "OBJECTID", "objectid")
        legacy_name_val = _get_prop(props, "Nombre", "nombre")
        legacy_osm_id_val = _get_prop(props, "OSMID", "osmid")
        highway_val = _get_prop(props, "highway")

        now = datetime.now(timezone.utc)
        return ViaModel(
            id=uuid.uuid4(),
            data_version_id=data_version_id,
            source_feature_id=feature.source_feature_id,
            osm_id=_to_int(osm_id_val),
            name=str(name_val)[:48] if name_val is not None else None,
            reference=str(ref_val)[:16] if ref_val is not None else None,
            road_type=str(road_type_val)[:16] if road_type_val is not None else None,
            is_one_way=_to_bool(oneway_val),
            is_bridge=_to_bool(bridge_val),
            max_speed=_to_int(maxspeed_val),
            object_id=_to_int(object_id_val),
            legacy_name=str(legacy_name_val)[:40] if legacy_name_val is not None else None,
            legacy_osm_id=_to_int(legacy_osm_id_val),
            highway_code=_to_int(highway_val),
            properties=props or {},
            geometry=from_shape(multi_geom, srid=4326),
            created_date=now,
            modified_date=now,
        )
