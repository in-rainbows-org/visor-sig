import uuid
from dataclasses import dataclass
from datetime import datetime
from typing import Optional


@dataclass(frozen=True)
class LayerDTO:
    """DTO inmutable para lecturas y consultas de capas."""

    id: uuid.UUID
    kind: str
    name: str
    geometry_type: str
    color: str
    active_data_version_id: Optional[uuid.UUID]
    updated_at: datetime
