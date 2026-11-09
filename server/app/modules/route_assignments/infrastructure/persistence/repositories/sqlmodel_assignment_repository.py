from datetime import datetime, timezone
from uuid import UUID

from sqlmodel import Session, select

from app.modules.route_assignments.domain.entities.assignment import Assignment
from app.modules.route_assignments.domain.repositories.assignment_repository import AssignmentRepository
from app.modules.route_assignments.domain.value_objects.assignment_status import AssignmentStatus
from app.modules.route_assignments.infrastructure.persistence.mappers.assignment_mapper import AssignmentMapper
from app.modules.route_assignments.infrastructure.persistence.models.assignment_model import AssignmentModel


class SQLModelAssignmentRepository(AssignmentRepository):
    """Implementación SQLModel del repositorio de cabeceras de asignaciones."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_id(self, assignment_id: UUID) -> Assignment | None:
        statement = select(AssignmentModel).where(
            AssignmentModel.id == assignment_id,
            AssignmentModel.deleted_date.is_(None),
        )
        record = self.db.exec(statement).first()
        return AssignmentMapper.to_domain(record) if record else None

    def find_in_progress_by_technician(self, technician_id: str) -> Assignment | None:
        statement = select(AssignmentModel).where(
            AssignmentModel.technician_id == technician_id,
            AssignmentModel.status == AssignmentStatus.IN_PROGRESS.value,
            AssignmentModel.deleted_date.is_(None),
        )
        record = self.db.exec(statement).first()
        return AssignmentMapper.to_domain(record) if record else None

    def save(self, assignment: Assignment) -> None:
        record = self.db.get(AssignmentModel, assignment.id)
        if record is None:
            model = AssignmentMapper.to_model(assignment)
            self.db.add(model)
            return

        record.technician_id = assignment.technician_id
        record.status = assignment.status.value if hasattr(assignment.status, "value") else str(assignment.status)
        record.assignment_type = assignment.assignment_type.value if hasattr(assignment.assignment_type, "value") else str(assignment.assignment_type)
        record.scheduled_date = assignment.scheduled_date
        record.start_latitude = assignment.start_latitude
        record.start_longitude = assignment.start_longitude
        record.total_stops = assignment.total_stops
        record.total_distance_km = assignment.total_distance_km
        record.started_at = assignment.started_at
        record.completed_at = assignment.completed_at

        if assignment.is_active:
            record.deleted_date = None
        elif record.deleted_date is None:
            record.deleted_date = datetime.now(timezone.utc)
        record.modified_date = datetime.now(timezone.utc)
