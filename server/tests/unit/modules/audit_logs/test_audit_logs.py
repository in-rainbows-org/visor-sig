import uuid
from datetime import datetime, timezone, timedelta
import pytest
from sqlmodel import Session, create_engine, select
from sqlalchemy.pool import StaticPool

from app.modules.audit_logs.domain.entities.audit_log import AuditLog
from app.modules.audit_logs.domain.enums import ActionType
from app.modules.audit_logs.domain.exceptions import InvalidAuditLogError
from app.modules.audit_logs.infrastructure.persistence.models.audit_log_model import AuditLogModel
from app.modules.audit_logs.infrastructure.persistence.repositories.sqlmodel_audit_log_repository import (
    SqlModelAuditLogRepository,
)
from app.modules.audit_logs.infrastructure.persistence.readers.sqlmodel_audit_log_reader import (
    SqlModelAuditLogReader,
)
from app.modules.audit_logs.application.dtos.audit_log_dtos import PaginatedAuditLogsDTO
from app.modules.audit_logs.application.queries.get_audit_logs import (
    GetAuditLogsQuery,
    GetAuditLogsQueryHandler,
)
from app.modules.audit_logs.application.use_cases.record_audit_log import (
    RecordAuditLogCommand,
    RecordAuditLogUseCase,
)
from app.shared.infrastructure.db.better_auth import BetterAuthUser


@pytest.fixture
def sqlite_session():
    """In-memory SQLite session isolating only AuditLogModel and BetterAuthUser tables."""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    AuditLogModel.metadata.create_all(
        engine,
        tables=[AuditLogModel.__table__, BetterAuthUser.__table__],
    )
    with Session(engine) as session:
        yield session


# =========================================================================
# Domain Entity Tests
# =========================================================================

def test_audit_log_entity_creation_valid():
    log = AuditLog.create(
        user_id="user_123",
        action=ActionType.LOGIN,
        description="Inicio de sesión",
    )

    assert log.user_id == "user_123"
    assert log.action == ActionType.LOGIN
    assert log.description == "Inicio de sesión"


def test_audit_log_entity_empty_user_id_raises():
    with pytest.raises(InvalidAuditLogError, match="user_id no puede estar vacío"):
        AuditLog.create(
            user_id="",
            action=ActionType.LOGIN,
            description="Login",
        )

    with pytest.raises(InvalidAuditLogError, match="user_id no puede estar vacío"):
        AuditLog.create(
            user_id="   ",
            action=ActionType.LOGIN,
            description="Login",
        )


def test_audit_log_entity_empty_description_raises():
    with pytest.raises(InvalidAuditLogError, match="description no puede estar vacía"):
        AuditLog.create(
            user_id="user_1",
            action=ActionType.LOGOUT,
            description="",
        )

    with pytest.raises(InvalidAuditLogError, match="description no puede estar vacía"):
        AuditLog.create(
            user_id="user_1",
            action=ActionType.LOGOUT,
            description="   ",
        )


def test_audit_log_entity_invalid_action_type_raises():
    with pytest.raises(InvalidAuditLogError, match="Acción inválida"):
        AuditLog.create(
            user_id="user_1",
            action="INVALID_ACTION",  # type: ignore[arg-type]
            description="Acción no existente",
        )


def test_audit_log_action_type_enum():
    expected_actions = {
        "LOGIN",
        "LOGOUT",
        "SEARCH",
        "CREATE",
        "UPDATE",
        "DELETE",
    }
    assert {a.value for a in ActionType} == expected_actions


# =========================================================================
# Repository Tests
# =========================================================================

def test_sqlmodel_audit_log_repository_save(sqlite_session: Session):
    repo = SqlModelAuditLogRepository(sqlite_session)
    log = AuditLog.create(
        user_id="user_save_test",
        action=ActionType.UPDATE,
        description="Versión v2 activada",
    )

    saved = repo.save(log)
    sqlite_session.commit()

    assert saved.user_id == "user_save_test"
    assert saved.action == ActionType.UPDATE
    assert saved.description == "Versión v2 activada"

    # Query directly from DB model
    db_record = sqlite_session.exec(
        select(AuditLogModel).where(AuditLogModel.user_id == "user_save_test")
    ).first()
    assert db_record is not None
    assert db_record.user_id == "user_save_test"
    assert db_record.action == ActionType.UPDATE.value
    assert db_record.description == "Versión v2 activada"


# =========================================================================
# Reader & Pagination Tests
# =========================================================================

def test_sqlmodel_audit_log_reader_empty(sqlite_session: Session):
    reader = SqlModelAuditLogReader(sqlite_session)
    result = reader.get_paginated(page=1, page_size=10)

    assert result.total == 0
    assert result.total_pages == 0
    assert result.page == 1
    assert result.page_size == 10
    assert len(result.items) == 0


def test_sqlmodel_audit_log_reader_pagination_and_sorting(sqlite_session: Session):
    base_time = datetime.now(timezone.utc)

    for i in range(15):
        log_model = AuditLogModel(
            id=uuid.uuid4(),
            user_id=f"user_{i}",
            action=ActionType.SEARCH.value,
            description=f"Consulta #{i}",
            created_date=base_time + timedelta(minutes=i),
        )
        sqlite_session.add(log_model)
    sqlite_session.commit()

    reader = SqlModelAuditLogReader(sqlite_session)

    # Page 1 (size 10)
    page1 = reader.get_paginated(page=1, page_size=10)
    assert page1.total == 15
    assert page1.total_pages == 2
    assert page1.page == 1
    assert len(page1.items) == 10
    # Items should be ordered descending by created_date (item 14 first)
    assert page1.items[0].description == "Consulta #14"
    assert page1.items[1].description == "Consulta #13"

    # Page 2 (size 10)
    page2 = reader.get_paginated(page=2, page_size=10)
    assert page2.total == 15
    assert page2.total_pages == 2
    assert page2.page == 2
    assert len(page2.items) == 5
    assert page2.items[0].description == "Consulta #4"
    assert page2.items[-1].description == "Consulta #0"


def test_sqlmodel_audit_log_reader_user_join(sqlite_session: Session):
    # Add a user to better auth table
    user = BetterAuthUser(
        id="user_admin_1",
        name="Admin User",
        email="admin@example.com",
        image="https://example.com/avatar.png",
    )
    sqlite_session.add(user)

    # Add audit log for this user
    log_known = AuditLogModel(
        id=uuid.uuid4(),
        user_id="user_admin_1",
        action=ActionType.LOGIN.value,
        description="Admin logueado",
        created_date=datetime.now(timezone.utc),
    )
    # Add audit log for unknown user
    log_unknown = AuditLogModel(
        id=uuid.uuid4(),
        user_id="ghost_user_999",
        action=ActionType.LOGOUT.value,
        description="Ghost deslogueado",
        created_date=datetime.now(timezone.utc) - timedelta(minutes=1),
    )
    sqlite_session.add(log_known)
    sqlite_session.add(log_unknown)
    sqlite_session.commit()

    reader = SqlModelAuditLogReader(sqlite_session)
    result = reader.get_paginated(page=1, page_size=10)

    assert result.total == 2
    item_known = next(item for item in result.items if item.user_id == "user_admin_1")
    assert item_known.user_name == "Admin User"
    assert item_known.user_image == "https://example.com/avatar.png"
    assert item_known.user_email == "admin@example.com"

    item_unknown = next(item for item in result.items if item.user_id == "ghost_user_999")
    assert item_unknown.user_name is None
    assert item_unknown.user_image is None
    assert item_unknown.user_email is None


# =========================================================================
# Use Case & Query Handler Tests
# =========================================================================

class FakeUnitOfWork:
    def __init__(self):
        self.committed = False

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        pass

    def commit(self):
        self.committed = True

    def rollback(self):
        pass

    def publish(self, event):
        pass


def test_record_audit_log_use_case(sqlite_session: Session):
    repo = SqlModelAuditLogRepository(sqlite_session)
    uow = FakeUnitOfWork()
    use_case = RecordAuditLogUseCase(audit_log_repo=repo, uow=uow)

    command = RecordAuditLogCommand(
        user_id="usr_uc_test",
        action=ActionType.UPDATE,
        description="Color cambiado a BLUE",
    )

    created_log = use_case.execute(command)

    assert created_log.user_id == "usr_uc_test"
    assert created_log.action == ActionType.UPDATE
    assert created_log.description == "Color cambiado a BLUE"
    assert uow.committed is True


def test_get_audit_logs_query_handler(sqlite_session: Session):
    reader = SqlModelAuditLogReader(sqlite_session)
    handler = GetAuditLogsQueryHandler(reader=reader)

    result = handler.execute(GetAuditLogsQuery(page=1, page_size=5))
    assert isinstance(result, PaginatedAuditLogsDTO)
    assert result.page == 1
    assert result.page_size == 5
    assert result.total == 0
