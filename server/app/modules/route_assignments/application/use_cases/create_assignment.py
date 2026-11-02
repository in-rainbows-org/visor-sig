from dataclasses import dataclass
from datetime import date
from typing import Any
from uuid import UUID

from sqlmodel import select

from app.core.security.auth import Role
from app.modules.layers.domain.enums import CodigoFijoStatus
from app.modules.layers.infrastructure.persistence.models.codigo_fijo_model import CodigoFijoModel
from app.modules.route_assignments.domain.entities.assignment import Assignment
from app.modules.route_assignments.domain.entities.assignment_stop import AssignmentStop
from app.modules.route_assignments.domain.exceptions import (
    DuplicateStopException,
    InvalidStopSequenceException,
    InvalidStopsCountException,
    InvalidTechnicianException,
    InvalidWaterStatusException,
)
from app.modules.route_assignments.domain.repositories.assignment_repository import (
    AssignmentRepository,
)
from app.modules.route_assignments.domain.repositories.assignment_stop_repository import (
    AssignmentStopRepository,
)
from app.modules.route_assignments.domain.value_objects.assignment_type import AssignmentType
from app.shared.application.ports import UnitOfWork
from app.shared.domain.exceptions import ValidationException
from app.shared.infrastructure.db.better_auth import BetterAuthUser


@dataclass(slots=True)
class CreateAssignmentStopCommand:
    """Datos de una parada individual a registrar."""

    codigo_fijo_id: UUID
    order_index: int
    target_status: int
    route_geometry: dict[str, Any]
    current_status: int | None = None


@dataclass(slots=True)
class CreateAssignmentCommand:
    """Comando transaccional para registrar una asignación con sus paradas."""

    technician_id: str
    assignment_type: AssignmentType
    scheduled_date: date
    start_latitude: float
    start_longitude: float
    total_distance_km: float
    stops: list[CreateAssignmentStopCommand]


class CreateAssignmentUseCase:
    """Caso de uso para registrar cabecera y paradas en una sola transacción atómica."""

    def __init__(
        self,
        assignment_repo: AssignmentRepository,
        stop_repo: AssignmentStopRepository,
        uow: UnitOfWork,
    ) -> None:
        self.assignment_repo = assignment_repo
        self.stop_repo = stop_repo
        self.uow = uow

    def execute(self, command: CreateAssignmentCommand) -> Assignment:
        total_stops = len(command.stops)
        self._validate_stops_count(total_stops)
        self._validate_technician(command.technician_id)
        self._validate_stop_sequence(command.stops, total_stops)
        validated_current_statuses = self._validate_and_get_water_statuses(command)

        # 1. Crear cabecera de asignación
        assignment = Assignment.create(
            technician_id=command.technician_id,
            assignment_type=command.assignment_type,
            scheduled_date=command.scheduled_date,
            start_latitude=command.start_latitude,
            start_longitude=command.start_longitude,
            total_stops=total_stops,
            total_distance_km=command.total_distance_km,
        )
        self.assignment_repo.save(assignment)

        # 2. Crear cada una de las paradas asociadas
        stops_to_save: list[AssignmentStop] = []
        for stop_cmd in command.stops:
            current_status = validated_current_statuses[stop_cmd.codigo_fijo_id]
            stop_entity = AssignmentStop.create(
                assignment_id=assignment.id,
                codigo_fijo_id=stop_cmd.codigo_fijo_id,
                order_index=stop_cmd.order_index,
                current_status=current_status,
                target_status=stop_cmd.target_status,
                route_geometry=stop_cmd.route_geometry,
            )
            stops_to_save.append(stop_entity)

        self.stop_repo.save_all(stops_to_save)

        # 3. Confirmar la transacción atómica
        self.uow.commit()

        return assignment

    @staticmethod
    def _validate_stops_count(total_stops: int) -> None:
        if total_stops < 1 or total_stops > 10:
            raise InvalidStopsCountException(
                f"La cantidad de paradas de una asignación debe estar entre 1 y 10 (recibidas: {total_stops})."
            )

    def _validate_technician(self, technician_id: str) -> None:
        user = self.uow.session.get(BetterAuthUser, technician_id)
        if user is None:
            raise InvalidTechnicianException(
                f"El técnico con identificador '{technician_id}' no existe en el sistema."
            )
        user_role = (user.role or "").upper()
        if user_role != Role.TECHNICIAN.value:
            raise InvalidTechnicianException(
                f"El usuario '{technician_id}' no tiene el rol de técnico (rol actual: '{user.role}')."
            )

    @staticmethod
    def _validate_stop_sequence(
        stops: list[CreateAssignmentStopCommand], total_stops: int
    ) -> None:
        seen_codes: set[UUID] = set()
        for s in stops:
            if s.codigo_fijo_id in seen_codes:
                raise DuplicateStopException(
                    f"El código fijo '{s.codigo_fijo_id}' está duplicado en la asignación."
                )
            seen_codes.add(s.codigo_fijo_id)

        indices = [s.order_index for s in stops]
        expected_indices = list(range(1, total_stops + 1))
        if sorted(indices) != expected_indices:
            raise InvalidStopSequenceException(
                f"Los índices de orden (order_index) deben ser una secuencia correlativa del 1 al {total_stops}."
            )

    def _validate_and_get_water_statuses(
        self, command: CreateAssignmentCommand
    ) -> dict[UUID, int]:
        stop_ids = [s.codigo_fijo_id for s in command.stops]
        statement = select(CodigoFijoModel).where(
            CodigoFijoModel.id.in_(stop_ids),
            CodigoFijoModel.deleted_date.is_(None),
        )
        records = self.uow.session.exec(statement).all()
        found_map = {r.id: r.status for r in records}

        for stop_cmd in command.stops:
            if stop_cmd.codigo_fijo_id not in found_map:
                raise ValidationException(
                    f"El código fijo '{stop_cmd.codigo_fijo_id}' no existe o está inactivo."
                )

            actual_status = found_map[stop_cmd.codigo_fijo_id]

            if command.assignment_type.is_cut():
                if stop_cmd.target_status != CodigoFijoStatus.CORTADO.value:
                    raise InvalidWaterStatusException(
                        f"Para asignaciones de tipo CUT, target_status debe ser "
                        f"{CodigoFijoStatus.CORTADO.value} (CORTADO), pero se recibió {stop_cmd.target_status}."
                    )
                if actual_status == CodigoFijoStatus.CORTADO.value:
                    raise InvalidWaterStatusException(
                        f"El código fijo '{stop_cmd.codigo_fijo_id}' ya se encuentra cortado (estado {actual_status}). "
                        "No se puede programar para corte."
                    )
            elif command.assignment_type.is_reconnection():
                if stop_cmd.target_status != CodigoFijoStatus.NORMAL.value:
                    raise InvalidWaterStatusException(
                        f"Para asignaciones de tipo RECONNECTION, target_status debe ser "
                        f"{CodigoFijoStatus.NORMAL.value} (NORMAL), pero se recibió {stop_cmd.target_status}."
                    )
                if actual_status == CodigoFijoStatus.NORMAL.value:
                    raise InvalidWaterStatusException(
                        f"El código fijo '{stop_cmd.codigo_fijo_id}' ya se encuentra en estado normal (estado {actual_status}). "
                        "No se puede programar para reconexión."
                    )

        return found_map
