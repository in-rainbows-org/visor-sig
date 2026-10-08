import uuid
from datetime import datetime, timezone
from typing import Any

import shapely
import shapely.wkb
from app.modules.layers.application.ports.providers.shapefile_processor import (
    ParsedFeature,
)
from app.modules.layers.domain.exceptions import InvalidShapefilePackageException
from app.modules.layers.infrastructure.persistence.models.manzana_model import (
    ManzanaModel,
)
from geoalchemy2.shape import from_shape


def _get_prop(props: dict[str, Any], *keys: str) -> Any:
    lower_map = {k.lower(): v for k, v in props.items()}
    for key in keys:
        val = lower_map.get(key.lower())
        if val is not None:
            return val
    return None


class ManzanaDatasetMapper:
    """Mapper para transformar entidades parsed de Shapefile a ManzanaModel."""

    REQUIRED_KEYS = ["id", "uv_mza", "uv", "mza"]

    @classmethod
    def validate_properties(cls, sample_properties: dict[str, Any]) -> None:
        lower_props = {k.lower() for k in sample_properties.keys()}
        missing = [k for k in cls.REQUIRED_KEYS if k not in lower_props]
        if missing:
            raise InvalidShapefilePackageException(
                f"El archivo Shapefile no contiene las columnas requeridas para Manzanas: {missing}."
            )

    @classmethod
    def to_model(cls, feature: ParsedFeature, data_version_id: uuid.UUID) -> ManzanaModel:
        props = feature.properties
        geom = shapely.from_wkb(feature.geometry_wkb)

        # Asegurar MultiPolygon
        if geom.geom_type == "Polygon":
            multi_geom = shapely.multipolygons([geom])
        elif geom.geom_type == "MultiPolygon":
            multi_geom = geom
        else:
            raise InvalidShapefilePackageException(
                f"Geometría incompatible para Manzanas: se esperaba Polygon o MultiPolygon, se obtuvo '{geom.geom_type}'."
            )

        source_id_val = _get_prop(props, "Id", "id")
        uv_block_code_val = _get_prop(props, "UV_MZA", "uv_mza", "uv_block_code")
        uv_val = _get_prop(props, "UV", "uv")
        mza_val = _get_prop(props, "MZA", "mza", "block_number")

        now = datetime.now(timezone.utc)
        return ManzanaModel(
            id=uuid.uuid4(),
            data_version_id=data_version_id,
            source_feature_id=feature.source_feature_id,
            source_id=int(source_id_val) if source_id_val is not None else None,
            uv_block_code=str(uv_block_code_val)[:20] if uv_block_code_val is not None else None,
            uv=str(uv_val)[:15] if uv_val is not None else None,
            block_number=str(mza_val)[:10] if mza_val is not None else None,
            properties=props or {},
            geometry=from_shape(multi_geom, srid=4326),
            created_date=now,
            modified_date=now,
        )
