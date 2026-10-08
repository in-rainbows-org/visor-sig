import uuid
from datetime import datetime, timezone
from typing import Any

import shapely
import shapely.wkb
from app.modules.layers.application.ports.providers.shapefile_processor import (
    ParsedFeature,
)
from app.modules.layers.domain.enums import CodigoFijoStatus
from app.modules.layers.domain.exceptions import InvalidShapefilePackageException
from app.modules.layers.infrastructure.persistence.models.codigo_fijo_model import (
    CodigoFijoModel,
)
from geoalchemy2.shape import from_shape


def _get_prop(props: dict[str, Any], *keys: str) -> Any:
    lower_map = {k.lower(): v for k, v in props.items()}
    for key in keys:
        val = lower_map.get(key.lower())
        if val is not None:
            return val
    return None


class CodigoFijoDatasetMapper:
    """Mapper para transformar entidades parsed de Shapefile a CodigoFijoModel."""

    REQUIRED_KEYS = ["codf_sql", "codf_sig", "codfijo", "nombre"]

    @classmethod
    def validate_properties(cls, sample_properties: dict[str, Any]) -> None:
        lower_props = {k.lower() for k in sample_properties.keys()}
        missing = [k for k in cls.REQUIRED_KEYS if k not in lower_props]
        if missing:
            raise InvalidShapefilePackageException(
                f"El archivo Shapefile no contiene las columnas requeridas para Códigos Fijos: {missing}."
            )

    @classmethod
    def to_model(cls, feature: ParsedFeature, data_version_id: uuid.UUID) -> CodigoFijoModel:
        props = feature.properties
        geom = shapely.from_wkb(feature.geometry_wkb)

        # Derivar punto representativo para coordenadas
        if geom.geom_type == "Point":
            lon, lat = geom.x, geom.y
            multi_geom = shapely.multipoints([geom])
        elif geom.geom_type == "MultiPoint":
            first_pt = geom.geoms[0]
            lon, lat = first_pt.x, first_pt.y
            multi_geom = geom
        else:
            centroid = geom.centroid
            lon, lat = centroid.x, centroid.y
            multi_geom = shapely.multipoints([centroid])

        sql_code_val = _get_prop(props, "CodF_SQL", "codf_sql", "sql_code")
        fixed_code_val = _get_prop(props, "CodFijo", "codfijo", "fixed_code")

        now = datetime.now(timezone.utc)
        return CodigoFijoModel(
            id=uuid.uuid4(),
            data_version_id=data_version_id,
            source_feature_id=feature.source_feature_id,
            label=str(_get_prop(props, "Text", "label") or "")[:254] or None,
            sql_code=int(sql_code_val) if sql_code_val is not None else None,
            sig_code=str(_get_prop(props, "CodF_SIG", "codf_sig", "sig_code") or "")[:25] or None,
            fixed_code=int(fixed_code_val) if fixed_code_val is not None else None,
            name=str(_get_prop(props, "Nombre", "nombre", "name") or "")[:120] or None,
            longitude=float(lon),
            latitude=float(lat),
            status=CodigoFijoStatus.NORMAL.value,
            status_changed_at=now,
            properties=props or {},
            geometry=from_shape(multi_geom, srid=4326),
            created_date=now,
            modified_date=now,
        )
