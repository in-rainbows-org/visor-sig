import uuid
from dataclasses import dataclass, field
from typing import Any


@dataclass(slots=True)
class Manzana:
    """
    Entidad de dominio pura que representa una manzana catastral.
    Sin dependencias de frameworks de persistencia ni HTTP.
    """

    id: uuid.UUID
    data_version_id: uuid.UUID
    source_feature_id: str | None
    source_id: int | None
    uv_block_code: str | None
    uv: str | None
    block_number: str | None
    geometry_wkt: str
    properties: dict[str, Any] = field(default_factory=dict)
