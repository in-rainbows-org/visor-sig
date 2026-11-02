from __future__ import annotations

from typing import Any
from uuid import UUID, uuid4

from app.modules.route_assignments.domain.value_objects.stop_status import StopStatus


class AssignmentStop:
    """Entidad de dominio pura que representa una parada individual de visita y su trazado."""

    def __init__(
        self,
        id: UUID,
        assignment_id: UUID,
        codigo_fijo_id: UUID,
        order_index: int,
        current_status: int,
        target_status: int,
        status: StopStatus,
        route_geometry: dict[str, Any],
        is_active: bool = True,
    ) -> None:
        self.id = id
        self.assignment_id = assignment_id
        self.codigo_fijo_id = codigo_fijo_id
        self.order_index = order_index
        self.current_status = current_status
        self.target_status = target_status
        self.status = status
        self.route_geometry = route_geometry
        self.is_active = is_active

    @classmethod
    def create(
        cls,
        *,
        assignment_id: UUID,
        codigo_fijo_id: UUID,
        order_index: int,
        current_status: int,
        target_status: int,
        route_geometry: dict[str, Any],
    ) -> AssignmentStop:
        """Fábrica de negocio: genera UUID y fija estado inicial PENDING."""
        return cls(
            id=uuid4(),
            assignment_id=assignment_id,
            codigo_fijo_id=codigo_fijo_id,
            order_index=order_index,
            current_status=current_status,
            target_status=target_status,
            status=StopStatus.PENDING,
            route_geometry=route_geometry,
            is_active=True,
        )

    def mark_completed(self) -> None:
        """Marca la visita a la parada como completada con éxito."""
        self.status = StopStatus.COMPLETED

    def mark_failed(self) -> None:
        """Marca la visita a la parada como fallida o no ejecutada."""
        self.status = StopStatus.FAILED
