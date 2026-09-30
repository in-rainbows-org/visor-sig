import uuid
from dataclasses import dataclass
from typing import Optional

from app.modules.layers.domain.enums import DataVersionStatus
from app.modules.layers.domain.exceptions import InvalidDataVersionStatusException


@dataclass
class DataVersion:
    """
    Entidad de dominio que representa una versión histórica o actual de datos geográficos para una capa.
    """

    id: uuid.UUID
    layer_id: uuid.UUID
    version_number: int
    source_filename: str
    status: DataVersionStatus = DataVersionStatus.PROCESSING
    feature_count: int = 0
    error_message: Optional[str] = None
    imported_by_user_id: Optional[str] = None

    def mark_as_ready(self, feature_count: int) -> None:
        if self.status != DataVersionStatus.PROCESSING:
            raise InvalidDataVersionStatusException(
                f"No se puede marcar como READY una versión con estado '{self.status}'."
            )
        self.status = DataVersionStatus.READY
        self.feature_count = feature_count
        self.error_message = None

    def mark_as_failed(self, error_message: str) -> None:
        if self.status != DataVersionStatus.PROCESSING:
            raise InvalidDataVersionStatusException(
                f"No se puede marcar como FAILED una versión con estado '{self.status}'."
            )
        self.status = DataVersionStatus.FAILED
        self.error_message = error_message
