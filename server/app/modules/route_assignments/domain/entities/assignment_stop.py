from __future__ import annotations

from datetime import datetime
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
        in_transit_at: datetime | None = None,
        arrived_at: datetime | None = None,
        completed_at: datetime | None = None,
        meter_reading: str | None = None,
        evidence_photo_url: str | None = None,
        observation: str | None = None,
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
        self.in_transit_at = in_transit_at
        self.arrived_at = arrived_at
        self.completed_at = completed_at
        self.meter_reading = meter_reading
        self.evidence_photo_url = evidence_photo_url
        self.observation = observation
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
        meter_reading: str | None = None,
        evidence_photo_url: str | None = None,
        observation: str | None = None,
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
            in_transit_at=None,
            arrived_at=None,
            completed_at=None,
            meter_reading=meter_reading,
            evidence_photo_url=evidence_photo_url,
            observation=observation,
            is_active=True,
        )

    def start_transit(self, now: datetime) -> None:
        """Marca el inicio de traslado del técnico hacia la parada."""
        self.status = StopStatus.IN_TRANSIT
        self.in_transit_at = now

    def mark_arrived(self, now: datetime) -> None:
        """Marca el arribo del técnico a la parada."""
        self.status = StopStatus.ARRIVED
        self.arrived_at = now

    def mark_completed(
        self,
        now: datetime | None = None,
        meter_reading: str | None = None,
        evidence_photo_url: str | None = None,
        observation: str | None = None,
    ) -> None:
        """Marca la visita a la parada como completada con éxito."""
        self.status = StopStatus.COMPLETED
        if now is not None:
            self.completed_at = now
        if meter_reading is not None:
            self.meter_reading = meter_reading
        if evidence_photo_url is not None:
            self.evidence_photo_url = evidence_photo_url
        if observation is not None:
            self.observation = observation

    def mark_failed(
        self,
        now: datetime | None = None,
        observation: str | None = None,
        evidence_photo_url: str | None = None,
    ) -> None:
        """Marca la visita a la parada como fallida o no ejecutada."""
        self.status = StopStatus.FAILED
        if now is not None:
            self.completed_at = now
        if observation is not None:
            self.observation = observation
        if evidence_photo_url is not None:
            self.evidence_photo_url = evidence_photo_url

