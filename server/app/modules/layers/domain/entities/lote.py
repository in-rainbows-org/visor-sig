import uuid
from dataclasses import dataclass
from typing import Optional


@dataclass
class Lote:
    """
    Entidad de dominio pura que representa un lote catastral.
    Sin dependencias de frameworks de persistencia ni HTTP.
    """

    id: uuid.UUID
    data_version_id: uuid.UUID
    source_feature_id: Optional[str]
    source_id: Optional[int]
    lot_number: Optional[str]
    geometry_wkt: str
