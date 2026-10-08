import uuid
import pytest
from sqlmodel import select

from app.core.dependencies import get_event_bus
from app.core.events.subscriptions import configure_event_subscriptions
from app.modules.audit_logs.domain.enums import ActionType
from app.modules.audit_logs.infrastructure.persistence.models.audit_log_model import AuditLogModel
from app.modules.consultations.domain.events import ConsultationPerformedEvent
from app.modules.layers.domain.events import (
    DataVersionActivatedEvent,
    GeographicDataImportedEvent,
    LayerColorChangedEvent,
)


@pytest.fixture(autouse=True)
def setup_subscriptions():
    event_bus = get_event_bus()
    configure_event_subscriptions(event_bus)


def test_consultation_performed_subscriber_records_audit_log(db_session):
    event_bus = get_event_bus()
    unique_user_id = f"test_usr_{uuid.uuid4().hex[:8]}"

    event = ConsultationPerformedEvent(
        user_id=unique_user_id,
        layer_name="LOTES",
        filter_type="CODIGO",
        query_value="05-01-002",
    )
    event_bus.publish(event)

    log = db_session.exec(
        select(AuditLogModel).where(AuditLogModel.user_id == unique_user_id)
    ).first()

    assert log is not None
    assert log.action == ActionType.SEARCH.value
    assert "Consulta alfanumérica en capa 'LOTES'" in log.description
    assert "CODIGO: 05-01-002" in log.description


def test_geographic_data_imported_subscriber_records_audit_log(db_session):
    event_bus = get_event_bus()
    unique_user_id = f"test_admin_{uuid.uuid4().hex[:8]}"

    event = GeographicDataImportedEvent(
        user_id=unique_user_id,
        layer_name="Manzanas",
        record_count=42,
    )
    event_bus.publish(event)

    log = db_session.exec(
        select(AuditLogModel).where(AuditLogModel.user_id == unique_user_id)
    ).first()

    assert log is not None
    assert log.action == ActionType.CREATE.value
    assert "Importación de datos geográficos para la capa 'Manzanas' (42 registros)" in log.description


def test_data_version_activated_subscriber_records_audit_log(db_session):
    event_bus = get_event_bus()
    unique_user_id = f"test_admin_{uuid.uuid4().hex[:8]}"

    event = DataVersionActivatedEvent(
        user_id=unique_user_id,
        layer_name="Lotes",
        version_number=2,
    )
    event_bus.publish(event)

    log = db_session.exec(
        select(AuditLogModel).where(AuditLogModel.user_id == unique_user_id)
    ).first()

    assert log is not None
    assert log.action == ActionType.UPDATE.value
    assert "Activación de versión v2 en capa 'Lotes'" in log.description


def test_layer_color_changed_subscriber_records_audit_log(db_session):
    event_bus = get_event_bus()
    unique_user_id = f"test_admin_{uuid.uuid4().hex[:8]}"

    event = LayerColorChangedEvent(
        user_id=unique_user_id,
        layer_name="Vías Urbanas",
        new_color="RED",
    )
    event_bus.publish(event)

    log = db_session.exec(
        select(AuditLogModel).where(AuditLogModel.user_id == unique_user_id)
    ).first()

    assert log is not None
    assert log.action == ActionType.UPDATE.value
    assert "Cambio de color en capa 'Vías Urbanas' a RED" in log.description
