import pytest
from collections.abc import Iterator
from sqlalchemy import text
from sqlmodel import Session, SQLModel, create_engine

from app.core.config import settings
import app.shared.infrastructure.db.models  # noqa: F401


@pytest.fixture(scope="session")
def postgis_engine():
    """
    Motor SQLAlchemy conectado a PostgreSQL con PostGIS.
    Falla explícitamente si se intenta usar SQLite para pruebas espaciales.
    """
    if settings.is_sqlite:
        pytest.skip("Las pruebas de integración espacial requieren PostgreSQL con PostGIS.")

    engine = create_engine(
        settings.database_url_normalized,
        echo=False,
        pool_pre_ping=True,
    )

    with engine.connect() as conn:
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis;"))
        result = conn.execute(text("SELECT PostGIS_Version();")).fetchone()
        assert result is not None, "PostGIS no está disponible en la base de datos de pruebas."
        conn.commit()

    # Crear tablas registradas en metadata
    SQLModel.metadata.create_all(engine)

    yield engine

    # Cleanup opcional de tablas si se desea al final de la sesión
    # SQLModel.metadata.drop_all(engine)
    engine.dispose()


@pytest.fixture(scope="function")
def db_session(postgis_engine) -> Iterator[Session]:
    """
    Sesión de BD aislada para pruebas de integración con rollback o transacción controlada.
    """
    connection = postgis_engine.connect()
    transaction = connection.begin()
    session = Session(bind=connection, join_transaction_mode="create_savepoint")

    yield session

    session.close()
    if transaction.is_active:
        transaction.rollback()
    connection.close()
