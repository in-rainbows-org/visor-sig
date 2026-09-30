import uuid
from dataclasses import dataclass
from datetime import datetime
from typing import Optional


@dataclass(frozen=True)
class DataVersionDTO:
    """DTO inmutable para lecturas y respuestas de versiones de datos."""

    id: uuid.UUID
    layer_id: uuid.UUID
    version_number: int
    status: str
    source_filename: str
    feature_count: int
    error_message: Optional[str]
    is_active: bool
    created_at: datetime
