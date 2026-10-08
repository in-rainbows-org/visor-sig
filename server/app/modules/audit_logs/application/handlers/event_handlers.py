import logging

from app.core.database import get_session
from app.core.dependencies import get_event_bus
from app.modules.audit_logs.application.use_cases.record_audit_log import (
    RecordAuditLogCommand,
    RecordAuditLogUseCase,
)
from app.modules.audit_logs.domain.enums import ActionType
from app.modules.audit_logs.infrastructure.persistence.repositories.sqlmodel_audit_log_repository import (
    SqlModelAuditLogRepository,
)
from app.modules.consultations.domain.events import ConsultationPerformedEvent
from app.modules.layers.domain.events import (
    DataVersionActivatedEvent,
    GeographicDataImportedEvent,
    LayerColorChangedEvent,
)
from app.shared.domain.event_bus import EventBus
from app.shared.infrastructure.unit_of_work import SqlModelUnitOfWork

logger = logging.getLogger(__name__)


def handle_consultation_performed(event: ConsultationPerformedEvent) -> None:
    """Registra en la bitácora la realización de una consulta alfanumérica."""
    try:
        session_gen = get_session()
        session = next(session_gen)
        try:
            repo = SqlModelAuditLogRepository(session)
            uow = SqlModelUnitOfWork(session, get_event_bus())
            use_case = RecordAuditLogUseCase(repo, uow)

            description = (
                f"Consulta alfanumérica en capa '{event.layer_name}' "
                f"({event.filter_type}: {event.query_value})"
            )
            use_case.execute(
                RecordAuditLogCommand(
                    user_id=event.user_id,
                    action=ActionType.SEARCH,
                    description=description,
                )
            )
        finally:
            session.close()
    except Exception:
        logger.exception("Error al registrar evento ConsultationPerformedEvent en bitácora")


def handle_geographic_data_imported(event: GeographicDataImportedEvent) -> None:
    """Registra en la bitácora la importación exitosa de un Shapefile."""
    try:
        session_gen = get_session()
        session = next(session_gen)
        try:
            repo = SqlModelAuditLogRepository(session)
            uow = SqlModelUnitOfWork(session, get_event_bus())
            use_case = RecordAuditLogUseCase(repo, uow)

            description = (
                f"Importación de datos geográficos para la capa '{event.layer_name}' "
                f"({event.record_count} registros)"
            )
            use_case.execute(
                RecordAuditLogCommand(
                    user_id=event.user_id,
                    action=ActionType.CREATE,
                    description=description,
                )
            )
        finally:
            session.close()
    except Exception:
        logger.exception("Error al registrar evento GeographicDataImportedEvent en bitácora")


def handle_data_version_activated(event: DataVersionActivatedEvent) -> None:
    """Registra en la bitácora la activación o reversión de una versión de datos."""
    try:
        session_gen = get_session()
        session = next(session_gen)
        try:
            repo = SqlModelAuditLogRepository(session)
            uow = SqlModelUnitOfWork(session, get_event_bus())
            use_case = RecordAuditLogUseCase(repo, uow)

            description = (
                f"Activación de versión v{event.version_number} en capa '{event.layer_name}'"
            )
            use_case.execute(
                RecordAuditLogCommand(
                    user_id=event.user_id,
                    action=ActionType.UPDATE,
                    description=description,
                )
            )
        finally:
            session.close()
    except Exception:
        logger.exception("Error al registrar evento DataVersionActivatedEvent en bitácora")


def handle_layer_color_changed(event: LayerColorChangedEvent) -> None:
    """Registra en la bitácora el cambio de color de una capa."""
    try:
        session_gen = get_session()
        session = next(session_gen)
        try:
            repo = SqlModelAuditLogRepository(session)
            uow = SqlModelUnitOfWork(session, get_event_bus())
            use_case = RecordAuditLogUseCase(repo, uow)

            description = (
                f"Cambio de color en capa '{event.layer_name}' a {event.new_color}"
            )
            use_case.execute(
                RecordAuditLogCommand(
                    user_id=event.user_id,
                    action=ActionType.UPDATE,
                    description=description,
                )
            )
        finally:
            session.close()
    except Exception:
        logger.exception("Error al registrar evento LayerColorChangedEvent en bitácora")


def register_audit_log_event_subscriptions(event_bus: EventBus) -> None:
    """Registra los listeners de auditoría en el bus de eventos."""
    event_bus.subscribe(ConsultationPerformedEvent, handle_consultation_performed)
    event_bus.subscribe(GeographicDataImportedEvent, handle_geographic_data_imported)
    event_bus.subscribe(DataVersionActivatedEvent, handle_data_version_activated)
    event_bus.subscribe(LayerColorChangedEvent, handle_layer_color_changed)
