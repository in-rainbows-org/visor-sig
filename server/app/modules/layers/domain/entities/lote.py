import uuid
from dataclasses import dataclass, field
from typing import Any


@dataclass(slots=True)
class Lote:
    """
    Entidad de dominio pura que representa un lote catastral.
    Sin dependencias de frameworks de persistencia ni HTTP.
    """

    id: uuid.UUID
    data_version_id: uuid.UUID
    source_feature_id: str | None
    source_id: int | None
    lot_number: str | None
    geometry_wkt: str
    manzana_id: uuid.UUID | None = None
    properties: dict[str, Any] = field(default_factory=dict)
