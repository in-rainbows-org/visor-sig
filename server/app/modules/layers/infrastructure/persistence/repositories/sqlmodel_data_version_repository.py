import uuid

from app.modules.layers.domain.entities.data_version import DataVersion
from app.modules.layers.domain.repositories.data_version_repository import (
    DataVersionRepository,
)
from app.modules.layers.infrastructure.persistence.mappers.data_version_mapper import (
    DataVersionMapper,
)
from app.modules.layers.infrastructure.persistence.models.data_version_model import (
    DataVersionModel,
)
from sqlalchemy import func
from sqlmodel import Session, select


class SqlModelDataVersionRepository(DataVersionRepository):
    """Implementación SQLModel del repositorio de versiones de datos."""

    def __init__(self, session: Session) -> None:
        self.session = session

    def find_by_id(self, version_id: uuid.UUID) -> DataVersion | None:
        statement = select(DataVersionModel).where(DataVersionModel.id == version_id)
        model = self.session.exec(statement).first()
        return DataVersionMapper.to_domain(model) if model else None

    def get_next_version_number(self, layer_id: uuid.UUID) -> int:
        statement = select(
            func.coalesce(func.max(DataVersionModel.version_number), 0)
        ).where(DataVersionModel.layer_id == layer_id)
        current_max = self.session.exec(statement).one()
        return int(current_max) + 1

    def save(self, version: DataVersion, imported_by_user_id: str | None = None) -> None:
        existing = self.session.get(DataVersionModel, version.id)
        model = DataVersionMapper.to_model(version, existing, imported_by_user_id)
        self.session.add(model)
        self.session.flush()

    def list_by_layer(self, layer_id: uuid.UUID) -> list[DataVersion]:
        statement = (
            select(DataVersionModel)
            .where(DataVersionModel.layer_id == layer_id)
            .order_by(DataVersionModel.version_number.desc())
        )
        models = self.session.exec(statement).all()
        return [DataVersionMapper.to_domain(m) for m in models]

    def set_active_version(self, layer_id: uuid.UUID, version_id: uuid.UUID) -> None:
        from sqlmodel import update
        self.session.exec(
            update(DataVersionModel)
            .where(DataVersionModel.layer_id == layer_id)
            .values(is_active=False)
        )
        self.session.exec(
            update(DataVersionModel)
            .where(DataVersionModel.id == version_id)
            .values(is_active=True)
        )
        self.session.flush()

    def get_active_version(self, layer_id: uuid.UUID) -> DataVersion | None:
        statement = select(DataVersionModel).where(
            DataVersionModel.layer_id == layer_id,
            DataVersionModel.is_active == True,
            DataVersionModel.deleted_date.is_(None),
        )
        model = self.session.exec(statement).first()
        return DataVersionMapper.to_domain(model) if model else None
