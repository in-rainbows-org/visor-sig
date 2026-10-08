import uuid
from dataclasses import dataclass, field
from typing import Any


@dataclass(slots=True)
class Via:
    """
    Entidad de dominio pura que representa un segmento de vía.
    Sin dependencias de frameworks de persistencia ni HTTP.
    """

    id: uuid.UUID
    data_version_id: uuid.UUID
    source_feature_id: str | None
    osm_id: int | None
    name: str | None
    reference: str | None
    road_type: str | None
    is_one_way: bool | None
    is_bridge: bool | None
    max_speed: int | None
    object_id: int | None
    legacy_name: str | None
    legacy_osm_id: int | None
    highway_code: int | None
    geometry_wkt: str
    properties: dict[str, Any] = field(default_factory=dict)
