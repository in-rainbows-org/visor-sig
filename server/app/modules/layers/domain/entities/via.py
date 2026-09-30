import uuid
from dataclasses import dataclass
from typing import Optional


@dataclass
class Via:
    """
    Entidad de dominio pura que representa un segmento de vía.
    Sin dependencias de frameworks de persistencia ni HTTP.
    """

    id: uuid.UUID
    data_version_id: uuid.UUID
    source_feature_id: Optional[str]
    osm_id: Optional[int]
    name: Optional[str]
    reference: Optional[str]
    road_type: Optional[str]
    is_one_way: Optional[bool]
    is_bridge: Optional[bool]
    max_speed: Optional[int]
    object_id: Optional[int]
    legacy_name: Optional[str]
    legacy_osm_id: Optional[int]
    highway_code: Optional[int]
    geometry_wkt: str
