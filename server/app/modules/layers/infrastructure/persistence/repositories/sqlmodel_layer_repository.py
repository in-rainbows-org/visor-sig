import uuid

from app.modules.layers.domain.entities.layer import Layer
from app.modules.layers.domain.enums import LayerKind
from app.modules.layers.domain.repositories.layer_repository import LayerRepository
from app.modules.layers.infrastructure.persistence.mappers.layer_mapper import (
    LayerMapper,
)
from app.modules.layers.infrastructure.persistence.models.data_version_model import (
    DataVersionModel,
)
from app.modules.layers.infrastructure.persistence.models.layer_model import LayerModel
from sqlmodel import Session, select


class SqlModelLayerRepository(LayerRepository):
    """Implementación SQLModel del repositorio de capas para el catálogo fijo."""

    def __init__(self, session: Session) -> None:
        self.session = session

    def _get_active_version_id(self, layer_id: uuid.UUID) -> uuid.UUID | None:
        statement = select(DataVersionModel.id).where(
            DataVersionModel.layer_id == layer_id,
            DataVersionModel.is_active == True,
            DataVersionModel.deleted_date.is_(None),
        )
        return self.session.exec(statement).first()

    def find_by_id(self, layer_id: uuid.UUID) -> Layer | None:
        statement = select(LayerModel).where(LayerModel.id == layer_id)
        model = self.session.exec(statement).first()
        if not model:
            return None
        active_ver_id = self._get_active_version_id(layer_id)
        return LayerMapper.to_domain(model, active_ver_id)

    def find_by_kind(self, kind: LayerKind) -> Layer | None:
        kind_str = kind.value if hasattr(kind, "value") else str(kind)
        statement = select(LayerModel).where(LayerModel.kind == kind_str)
        model = self.session.exec(statement).first()
        if not model:
            return None
        active_ver_id = self._get_active_version_id(model.id)
        return LayerMapper.to_domain(model, active_ver_id)

    def save(self, layer: Layer) -> None:
        existing = self.session.get(LayerModel, layer.id)
        model = LayerMapper.to_model(layer, existing)
        self.session.add(model)
        self.session.flush()

    def list_layers(self) -> list[Layer]:
        statement = select(LayerModel).order_by(LayerModel.name.asc())
        models = self.session.exec(statement).all()
        if not models:
            return []
        active_stmt = select(DataVersionModel.layer_id, DataVersionModel.id).where(
            DataVersionModel.is_active == True,
            DataVersionModel.deleted_date.is_(None),
        )
        active_map = dict(self.session.exec(active_stmt).all())
        return [LayerMapper.to_domain(m, active_map.get(m.id)) for m in models]
