import pytest
from sqlmodel import Session, create_engine
from app.core.config import settings
from app.core.database import get_session
from app.main import app


@pytest.fixture(autouse=True)
def isolated_contract_db():
    engine = create_engine(settings.database_url_normalized)
    connection = engine.connect()
    trans = connection.begin()
    session = Session(bind=connection, join_transaction_mode="create_savepoint")

    app.dependency_overrides[get_session] = lambda: session

    yield session

    session.close()
    if trans.is_active:
        trans.rollback()
    connection.close()
    app.dependency_overrides.pop(get_session, None)
    engine.dispose()
