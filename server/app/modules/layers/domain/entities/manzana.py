import uuid
from dataclasses import dataclass
from typing import Optional


@dataclass
class Manzana:
    """
    Entidad de dominio pura que representa una manzana catastral.
    Sin dependencias de frameworks de persistencia ni HTTP.
    """

    id: uuid.UUID
    data_version_id: uuid.UUID
    source_feature_id: Optional[str]
    source_id: Optional[int]
    uv_block_code: Optional[str]
    uv: Optional[str]
    block_number: Optional[str]
    geometry_wkt: str
