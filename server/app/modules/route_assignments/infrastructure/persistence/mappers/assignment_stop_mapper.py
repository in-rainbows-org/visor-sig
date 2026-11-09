from datetime import datetime, timezone

from app.modules.route_assignments.domain.entities.assignment_stop import AssignmentStop
from app.modules.route_assignments.domain.value_objects.stop_status import StopStatus
from app.modules.route_assignments.infrastructure.persistence.models.assignment_stop_model import AssignmentStopModel


class AssignmentStopMapper:
    """Mapeador bidireccional entre la entidad AssignmentStop y el modelo AssignmentStopModel."""

    @staticmethod
    def to_domain(model: AssignmentStopModel) -> AssignmentStop:
        return AssignmentStop(
            id=model.id,
            assignment_id=model.assignment_id,
            codigo_fijo_id=model.codigo_fijo_id,
            order_index=model.order_index,
            current_status=model.current_status,
            target_status=model.target_status,
            status=StopStatus(model.status),
            route_geometry=model.route_geometry or {},
            in_transit_at=model.in_transit_at,
            arrived_at=model.arrived_at,
            completed_at=model.completed_at,
            meter_reading=model.meter_reading,
            evidence_photo_url=model.evidence_photo_url,
            observation=model.observation,
            is_active=model.deleted_date is None,
        )

    @staticmethod
    def to_model(entity: AssignmentStop) -> AssignmentStopModel:
        model = AssignmentStopModel(
            id=entity.id,
            assignment_id=entity.assignment_id,
            codigo_fijo_id=entity.codigo_fijo_id,
            order_index=entity.order_index,
            current_status=entity.current_status,
            target_status=entity.target_status,
            status=entity.status.value if hasattr(entity.status, "value") else str(entity.status),
            route_geometry=entity.route_geometry,
            in_transit_at=entity.in_transit_at,
            arrived_at=entity.arrived_at,
            completed_at=entity.completed_at,
            meter_reading=entity.meter_reading,
            evidence_photo_url=entity.evidence_photo_url,
            observation=entity.observation,
        )
        if not entity.is_active:
            model.deleted_date = datetime.now(timezone.utc)
        return model

