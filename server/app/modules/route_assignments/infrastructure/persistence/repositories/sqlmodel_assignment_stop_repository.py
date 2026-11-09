from datetime import datetime, timezone
from uuid import UUID

from sqlmodel import Session, select

from app.modules.route_assignments.domain.entities.assignment_stop import AssignmentStop
from app.modules.route_assignments.domain.repositories.assignment_stop_repository import AssignmentStopRepository
from app.modules.route_assignments.infrastructure.persistence.mappers.assignment_stop_mapper import AssignmentStopMapper
from app.modules.route_assignments.infrastructure.persistence.models.assignment_stop_model import AssignmentStopModel


class SQLModelAssignmentStopRepository(AssignmentStopRepository):
    """Implementación SQLModel del repositorio de paradas de asignaciones."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_id(self, stop_id: UUID) -> AssignmentStop | None:
        statement = select(AssignmentStopModel).where(
            AssignmentStopModel.id == stop_id,
            AssignmentStopModel.deleted_date.is_(None),
        )
        record = self.db.exec(statement).first()
        return AssignmentStopMapper.to_domain(record) if record else None

    def list_by_assignment_id(self, assignment_id: UUID) -> list[AssignmentStop]:
        statement = (
            select(AssignmentStopModel)
            .where(
                AssignmentStopModel.assignment_id == assignment_id,
                AssignmentStopModel.deleted_date.is_(None),
            )
            .order_by(AssignmentStopModel.order_index.asc())
        )
        records = self.db.exec(statement).all()
        return [AssignmentStopMapper.to_domain(r) for r in records]

    def save(self, stop: AssignmentStop) -> None:
        record = self.db.get(AssignmentStopModel, stop.id)
        if record is None:
            model = AssignmentStopMapper.to_model(stop)
            self.db.add(model)
            return

        record.assignment_id = stop.assignment_id
        record.codigo_fijo_id = stop.codigo_fijo_id
        record.order_index = stop.order_index
        record.current_status = stop.current_status
        record.target_status = stop.target_status
        record.status = stop.status.value if hasattr(stop.status, "value") else str(stop.status)
        record.route_geometry = stop.route_geometry
        record.in_transit_at = stop.in_transit_at
        record.arrived_at = stop.arrived_at
        record.completed_at = stop.completed_at
        record.meter_reading = stop.meter_reading
        record.observation = stop.observation
        record.evidence_photo_url = stop.evidence_photo_url

        if stop.is_active:
            record.deleted_date = None
        elif record.deleted_date is None:
            record.deleted_date = datetime.now(timezone.utc)
        record.modified_date = datetime.now(timezone.utc)

    def save_all(self, stops: list[AssignmentStop]) -> None:
        for stop in stops:
            self.save(stop)
