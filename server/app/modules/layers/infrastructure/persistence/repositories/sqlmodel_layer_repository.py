import uuid
from typing import Optional
from sqlmodel import Session, select

from app.modules.layers.domain.entities.layer import Layer
from app.modules.layers.domain.enums import LayerKind
from app.modules.layers.domain.repositories.layer_repository import LayerRepository
from app.modules.layers.infrastructure.persistence.mappers.layer_mapper import LayerMapper
from app.modules.layers.infrastructure.persistence.models.layer_model import LayerModel


class SqlModelLayerRepository(LayerRepository):
    """Implementación SQLModel del repositorio de capas para el catálogo fijo."""

    def __init__(self, session: Session) -> None:
        self.session = session

    def find_by_id(self, layer_id: uuid.UUID) -> Optional[Layer]:
        statement = select(LayerModel).where(LayerModel.id == layer_id)
        model = self.session.exec(statement).first()
        return LayerMapper.to_domain(model) if model else None

    def find_by_kind(self, kind: LayerKind) -> Optional[Layer]:
        kind_str = kind.value if hasattr(kind, "value") else str(kind)
        statement = select(LayerModel).where(LayerModel.kind == kind_str)
        model = self.session.exec(statement).first()
        return LayerMapper.to_domain(model) if model else None

    def save(self, layer: Layer) -> None:
        existing = self.session.get(LayerModel, layer.id)
        model = LayerMapper.to_model(layer, existing)
        self.session.add(model)
        self.session.flush()

    def list_layers(self) -> list[Layer]:
        statement = select(LayerModel).order_by(LayerModel.name.asc())
        models = self.session.exec(statement).all()
        return [LayerMapper.to_domain(m) for m in models]
