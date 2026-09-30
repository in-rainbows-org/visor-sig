import uuid
from datetime import datetime, timezone
from typing import Any
import shapely
import shapely.wkb
from geoalchemy2.shape import from_shape

from app.modules.layers.application.ports.providers.shapefile_processor import ParsedFeature
from app.modules.layers.domain.exceptions import InvalidShapefilePackageException
from app.modules.layers.infrastructure.persistence.models.lote_model import LoteModel


def _get_prop(props: dict[str, Any], *keys: str) -> Any:
    lower_map = {k.lower(): v for k, v in props.items()}
    for key in keys:
        val = lower_map.get(key.lower())
        if val is not None:
            return val
    return None


class LoteDatasetMapper:
    """Mapper para transformar entidades parsed de Shapefile a LoteModel."""

    REQUIRED_KEYS = ["id", "nrolote"]

    @classmethod
    def validate_properties(cls, sample_properties: dict[str, Any]) -> None:
        lower_props = {k.lower() for k in sample_properties.keys()}
        missing = [k for k in cls.REQUIRED_KEYS if k not in lower_props]
        if missing:
            raise InvalidShapefilePackageException(
                f"El archivo Shapefile no contiene las columnas requeridas para Lotes: {missing}."
            )

    @classmethod
    def to_model(cls, feature: ParsedFeature, data_version_id: uuid.UUID) -> LoteModel:
        props = feature.properties
        geom = shapely.from_wkb(feature.geometry_wkb)

        # Asegurar MultiPolygon
        if geom.geom_type == "Polygon":
            multi_geom = shapely.multipolygons([geom])
        elif geom.geom_type == "MultiPolygon":
            multi_geom = geom
        else:
            raise InvalidShapefilePackageException(
                f"Geometría incompatible para Lotes: se esperaba Polygon o MultiPolygon, se obtuvo '{geom.geom_type}'."
            )

        source_id_val = _get_prop(props, "Id", "id")
        lot_number_val = _get_prop(props, "NroLote", "nrolote", "lot_number")

        now = datetime.now(timezone.utc)
        return LoteModel(
            id=uuid.uuid4(),
            data_version_id=data_version_id,
            source_feature_id=feature.source_feature_id,
            source_id=int(source_id_val) if source_id_val is not None else None,
            lot_number=str(lot_number_val)[:15] if lot_number_val is not None else None,
            geometry=from_shape(multi_geom, srid=4326),
            created_date=now,
            modified_date=now,
        )
