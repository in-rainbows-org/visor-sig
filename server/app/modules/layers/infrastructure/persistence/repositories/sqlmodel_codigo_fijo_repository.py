import uuid
from sqlalchemy import func
from sqlmodel import Session, select

from app.modules.layers.infrastructure.persistence.models.codigo_fijo_model import CodigoFijoModel


class SqlModelCodigoFijoRepository:
    """Repositorio SQLModel para persistencia de la tabla specialized 'codigos_fijos'."""

    def __init__(self, session: Session) -> None:
        self.session = session

    def bulk_insert(self, items: list[CodigoFijoModel], batch_size: int = 1000) -> None:
        if not items:
            return
        for i in range(0, len(items), batch_size):
            chunk = items[i : i + batch_size]
            self.session.add_all(chunk)
            self.session.flush()

    def count_by_version(self, data_version_id: uuid.UUID) -> int:
        statement = (
            select(func.count(CodigoFijoModel.id))
            .where(CodigoFijoModel.data_version_id == data_version_id)
            .where(CodigoFijoModel.deleted_date.is_(None))
        )
        return self.session.exec(statement).one() or 0

    def delete_by_version(self, data_version_id: uuid.UUID) -> None:
        statement = select(CodigoFijoModel).where(CodigoFijoModel.data_version_id == data_version_id)
        records = self.session.exec(statement).all()
        for record in records:
            self.session.delete(record)
        self.session.flush()
