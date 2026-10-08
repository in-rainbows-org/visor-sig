import uuid
from dataclasses import dataclass
from datetime import datetime

from app.modules.layers.domain.enums import DataVersionStatus
from app.modules.layers.domain.exceptions import InvalidDataVersionStatusException


@dataclass(slots=True)
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
    error_message: str | None = None
    imported_by_user_id: str | None = None
    is_active: bool = False
    created_at: datetime | None = None

    @classmethod
    def create(
        cls,
        *,
        layer_id: uuid.UUID,
        version_number: int,
        source_filename: str,
        user_id: str | None = None,
        version_id: uuid.UUID | None = None,
    ) -> "DataVersion":
        return cls(
            id=version_id or uuid.uuid4(),
            layer_id=layer_id,
            version_number=version_number,
            source_filename=source_filename,
            status=DataVersionStatus.PROCESSING,
            feature_count=0,
            error_message=None,
            imported_by_user_id=user_id,
            is_active=False,
        )

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

    def activate(self) -> None:
        self.is_active = True

    def deactivate(self) -> None:
        self.is_active = False
