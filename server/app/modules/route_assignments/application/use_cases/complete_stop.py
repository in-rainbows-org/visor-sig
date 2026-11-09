from dataclasses import dataclass
from datetime import datetime, timezone
from uuid import UUID

from app.modules.layers.domain.enums import CodigoFijoStatus
from app.modules.layers.domain.repositories.codigo_fijo_repository import (
    CodigoFijoRepository,
)
from app.modules.route_assignments.domain.entities.assignment_stop import AssignmentStop
from app.modules.route_assignments.domain.exceptions import (
    AssignmentNotFoundException,
    AssignmentOwnershipException,
    InvalidAssignmentStatusTransitionException,
    InvalidStopStatusTransitionException,
    MissingEvidencePhotoException,
    MissingMeterReadingException,
    MissingStopObservationException,
    StopNotFoundException,
)
from app.modules.route_assignments.domain.repositories.assignment_repository import (
    AssignmentRepository,
)
from app.modules.route_assignments.domain.repositories.assignment_stop_repository import (
    AssignmentStopRepository,
)
from app.modules.route_assignments.domain.value_objects.assignment_status import (
    AssignmentStatus,
)
from app.modules.route_assignments.domain.value_objects.stop_status import StopStatus
from app.shared.application.ports import ImageStorageService, UnitOfWork
from app.shared.domain.exceptions import DomainException


@dataclass(slots=True)
class CompleteStopCommand:
    """Comando para concluir la visita técnica de una parada (exitosa o fallida)."""

    assignment_id: UUID
    stop_id: UUID
    technician_id: str
    status: str
    observation: str | None = None
    meter_reading: str | None = None
    image_bytes: bytes | None = None
    image_filename: str | None = None
    evidence_photo_url: str | None = None


class CompleteStopUseCase:
    """Caso de uso para finalizar la visita a una parada y cerrar la asignación si es la última."""

    def __init__(
        self,
        assignment_repo: AssignmentRepository,
        stop_repo: AssignmentStopRepository,
        uow: UnitOfWork,
        codigo_fijo_repo: CodigoFijoRepository | None = None,
        image_storage: ImageStorageService | None = None,
    ) -> None:
        self.assignment_repo = assignment_repo
        self.stop_repo = stop_repo
        self.uow = uow
        self.codigo_fijo_repo = codigo_fijo_repo
        self.image_storage = image_storage

    def execute(self, command: CompleteStopCommand) -> AssignmentStop:
        assignment = self.assignment_repo.get_by_id(command.assignment_id)
        if assignment is None:
            raise AssignmentNotFoundException()

        if assignment.technician_id != command.technician_id:
            raise AssignmentOwnershipException()

        if assignment.status != AssignmentStatus.IN_PROGRESS:
            raise InvalidAssignmentStatusTransitionException(
                f"La asignación se encuentra en estado '{assignment.status.value}', debe estar en 'IN_PROGRESS' para concluir paradas."
            )

        stop = self.stop_repo.get_by_id(command.stop_id)
        if stop is None or stop.assignment_id != command.assignment_id:
            raise StopNotFoundException()

        if stop.status != StopStatus.ARRIVED:
            raise InvalidStopStatusTransitionException(
                f"La parada #{stop.order_index} se encuentra en estado '{stop.status.value}', debe estar en 'ARRIVED' para concluir la visita."
            )

        status_norm = command.status.upper()
        now = datetime.now(timezone.utc)

        # 1. Resolver subida a Cloudinary si se enviaron bytes de imagen
        photo_url = command.evidence_photo_url
        if command.image_bytes:
            if self.image_storage is None:
                raise DomainException("Servicio de almacenamiento de imágenes no configurado.")
            photo_url = self.image_storage.upload_image(
                file_bytes=command.image_bytes,
                filename=command.image_filename,
                folder="sig",
            )

        # 2. Validar y procesar según resultado
        if status_norm == "FAILED":
            if not command.observation or not command.observation.strip():
                raise MissingStopObservationException()
            stop.mark_failed(
                now=now,
                observation=command.observation.strip(),
                evidence_photo_url=photo_url,
            )
        elif status_norm in ("SUCCESS", "COMPLETED"):
            if not command.meter_reading or not command.meter_reading.strip():
                raise MissingMeterReadingException()
            if not photo_url or not photo_url.strip():
                raise MissingEvidencePhotoException()

            stop.mark_completed(
                now=now,
                meter_reading=command.meter_reading.strip(),
                evidence_photo_url=photo_url.strip(),
                observation=command.observation.strip() if command.observation else None,
            )

            # 3. Transicionar estado del Código Fijo en caso exitoso
            if self.codigo_fijo_repo is not None:
                codigo_fijo = self.codigo_fijo_repo.get_by_id(stop.codigo_fijo_id)
                if codigo_fijo is not None:
                    if assignment.assignment_type.is_cut():
                        codigo_fijo.status = CodigoFijoStatus.CORTADO
                    elif assignment.assignment_type.is_reconnection():
                        codigo_fijo.status = CodigoFijoStatus.NORMAL
                    else:
                        codigo_fijo.status = CodigoFijoStatus(stop.target_status)
                    codigo_fijo.status_changed_at = now
                    self.codigo_fijo_repo.save(codigo_fijo)
        else:
            raise InvalidStopStatusTransitionException(
                f"Estado de finalización no reconocido: '{command.status}'"
            )

        self.stop_repo.save(stop)

        all_stops = self.stop_repo.list_by_assignment_id(command.assignment_id)
        all_terminal = all(
            (stop.status if s.id == stop.id else s.status) in (StopStatus.COMPLETED, StopStatus.FAILED)
            for s in all_stops
        )
        if all_stops and all_terminal:
            assignment.complete(now=now)
            self.assignment_repo.save(assignment)

        self.uow.commit()

        return stop
