from datetime import datetime, timezone

from app.modules.route_assignments.domain.entities.assignment import Assignment
from app.modules.route_assignments.domain.value_objects.assignment_status import AssignmentStatus
from app.modules.route_assignments.domain.value_objects.assignment_type import AssignmentType
from app.modules.route_assignments.infrastructure.persistence.models.assignment_model import AssignmentModel


class AssignmentMapper:
    """Mapeador bidireccional entre la entidad de dominio Assignment y el modelo AssignmentModel."""

    @staticmethod
    def to_domain(model: AssignmentModel) -> Assignment:
        return Assignment(
            id=model.id,
            technician_id=model.technician_id,
            status=AssignmentStatus(model.status),
            assignment_type=AssignmentType(model.assignment_type),
            scheduled_date=model.scheduled_date,
            start_latitude=model.start_latitude,
            start_longitude=model.start_longitude,
            total_stops=model.total_stops,
            total_distance_km=model.total_distance_km,
            started_at=model.started_at,
            completed_at=model.completed_at,
            is_active=model.deleted_date is None,
        )

    @staticmethod
    def to_model(entity: Assignment) -> AssignmentModel:
        model = AssignmentModel(
            id=entity.id,
            technician_id=entity.technician_id,
            status=entity.status.value if hasattr(entity.status, "value") else str(entity.status),
            assignment_type=entity.assignment_type.value if hasattr(entity.assignment_type, "value") else str(entity.assignment_type),
            scheduled_date=entity.scheduled_date,
            start_latitude=entity.start_latitude,
            start_longitude=entity.start_longitude,
            total_stops=entity.total_stops,
            total_distance_km=entity.total_distance_km,
            started_at=entity.started_at,
            completed_at=entity.completed_at,
        )
        if not entity.is_active:
            model.deleted_date = datetime.now(timezone.utc)
        return model
