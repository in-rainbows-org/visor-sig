from sqlmodel import Session, select

from app.modules.route_assignments.application.dtos.technician_assignment_dto import (
    TechnicianAssignmentDTO,
)
from app.modules.route_assignments.application.ports.readers.technician_assignments_reader import (
    TechnicianAssignmentsReader,
)
from app.modules.route_assignments.infrastructure.persistence.models.assignment_model import (
    AssignmentModel,
)


class SqlModelTechnicianAssignmentsReader(TechnicianAssignmentsReader):
    """Implementación SQLModel del lector de asignaciones asignadas al técnico autenticado."""

    def __init__(self, session: Session) -> None:
        self.session = session

    def list_by_technician(self, technician_id: str) -> list[TechnicianAssignmentDTO]:
        stmt = (
            select(AssignmentModel)
            .where(
                AssignmentModel.technician_id == technician_id,
                AssignmentModel.deleted_date.is_(None),
            )
            .order_by(
                AssignmentModel.scheduled_date.desc(),
                AssignmentModel.created_date.desc(),
            )
        )
        rows = self.session.exec(stmt).all()

        return [
            TechnicianAssignmentDTO(
                id=a.id,
                assignment_type=a.assignment_type,
                status=a.status,
                scheduled_date=a.scheduled_date,
                total_stops=a.total_stops,
                total_distance_km=a.total_distance_km,
                started_at=a.started_at,
                completed_at=a.completed_at,
                created_date=a.created_date,
            )
            for a in rows
        ]
