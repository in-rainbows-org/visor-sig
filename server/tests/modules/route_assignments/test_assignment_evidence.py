from datetime import datetime, timezone
from uuid import uuid4

import pytest

from app.modules.route_assignments.application.dtos.assignment_detail_dto import (
    AssignmentStopDetailItemDTO,
)
from app.modules.route_assignments.domain.entities.assignment_stop import AssignmentStop
from app.modules.route_assignments.domain.value_objects.stop_status import StopStatus
from app.modules.route_assignments.infrastructure.api.schemas.assignment_schemas import (
    AssignmentStopDetailRead,
)


def test_assignment_stop_evidence_initial_empty():
    """Valida que una parada recién creada tenga campos de evidencia en None."""
    stop = AssignmentStop.create(
        assignment_id=uuid4(),
        codigo_fijo_id=uuid4(),
        order_index=1,
        current_status=1,
        target_status=2,
        route_geometry={"type": "LineString", "coordinates": []},
    )

    assert stop.meter_reading is None
    assert stop.evidence_photo_url is None
    assert stop.observation is None


def test_assignment_stop_mark_completed_with_evidence():
    """Valida que al completar una parada se registren lectura, foto de evidencia y observación."""
    stop = AssignmentStop.create(
        assignment_id=uuid4(),
        codigo_fijo_id=uuid4(),
        order_index=1,
        current_status=1,
        target_status=2,
        route_geometry={"type": "LineString", "coordinates": []},
    )
    completed_time = datetime(2026, 11, 8, 14, 0, tzinfo=timezone.utc)

    stop.mark_completed(
        now=completed_time,
        meter_reading="0014285",
        evidence_photo_url="https://storage.sig.example/evidences/stop_1_meter.jpg",
        observation="Precinto colocado correctamente y medidor verificado.",
    )

    assert stop.status == StopStatus.COMPLETED
    assert stop.completed_at == completed_time
    assert stop.meter_reading == "0014285"
    assert stop.evidence_photo_url == "https://storage.sig.example/evidences/stop_1_meter.jpg"
    assert stop.observation == "Precinto colocado correctamente y medidor verificado."


def test_assignment_stop_mark_failed_with_observation():
    """Valida que una parada fallida registre motivo u observación de impedimento."""
    stop = AssignmentStop.create(
        assignment_id=uuid4(),
        codigo_fijo_id=uuid4(),
        order_index=2,
        current_status=1,
        target_status=2,
        route_geometry={"type": "LineString", "coordinates": []},
    )
    failed_time = datetime(2026, 11, 8, 14, 30, tzinfo=timezone.utc)

    stop.mark_failed(
        now=failed_time,
        observation="Inmueble con reja cerrada y candado. Perro peligroso en el patio.",
        evidence_photo_url="https://storage.sig.example/evidences/stop_2_gate.jpg",
    )

    assert stop.status == StopStatus.FAILED
    assert stop.completed_at == failed_time
    assert stop.observation == "Inmueble con reja cerrada y candado. Perro peligroso en el patio."
    assert stop.evidence_photo_url == "https://storage.sig.example/evidences/stop_2_gate.jpg"


def test_assignment_stop_detail_dto_and_read_schema_serialization():
    """Valida que el DTO y el esquema Pydantic serialicen los campos de evidencia sin pérdida de datos."""
    stop_id = uuid4()
    cf_id = uuid4()

    dto = AssignmentStopDetailItemDTO(
        id=stop_id,
        codigo_fijo_id=cf_id,
        fixed_code=10452,
        name="María González",
        latitude=-16.5001,
        longitude=-68.1502,
        order_index=1,
        status="COMPLETED",
        in_transit_at=datetime(2026, 11, 8, 13, 30, tzinfo=timezone.utc),
        arrived_at=datetime(2026, 11, 8, 13, 45, tzinfo=timezone.utc),
        completed_at=datetime(2026, 11, 8, 14, 0, tzinfo=timezone.utc),
        route_geometry={"type": "LineString", "coordinates": [[-68.15, -16.50]]},
        meter_reading="0039401",
        evidence_photo_url="https://storage.sig.example/evidences/photo.webp",
        observation="Sin novedades",
    )

    read_model = AssignmentStopDetailRead(
        id=dto.id,
        codigo_fijo_id=dto.codigo_fijo_id,
        fixed_code=dto.fixed_code,
        name=dto.name,
        latitude=dto.latitude,
        longitude=dto.longitude,
        order_index=dto.order_index,
        status=dto.status,
        in_transit_at=dto.in_transit_at,
        arrived_at=dto.arrived_at,
        completed_at=dto.completed_at,
        route_geometry=dto.route_geometry,
        meter_reading=dto.meter_reading,
        evidence_photo_url=dto.evidence_photo_url,
        observation=dto.observation,
    )

    data = read_model.model_dump()
    assert data["meter_reading"] == "0039401"
    assert data["evidence_photo_url"] == "https://storage.sig.example/evidences/photo.webp"
    assert data["observation"] == "Sin novedades"


def test_assignment_stop_detail_read_schema_null_evidence():
    """Valida que el esquema admita valores nulos para asignaciones pendientes o históricas."""
    read_model = AssignmentStopDetailRead(
        id=uuid4(),
        codigo_fijo_id=uuid4(),
        fixed_code=None,
        name=None,
        latitude=-16.5,
        longitude=-68.1,
        order_index=2,
        status="PENDING",
        route_geometry={},
        meter_reading=None,
        evidence_photo_url=None,
        observation=None,
    )

    data = read_model.model_dump()
    assert data["meter_reading"] is None
    assert data["evidence_photo_url"] is None
    assert data["observation"] is None
