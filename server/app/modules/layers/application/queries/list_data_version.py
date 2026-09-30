import uuid
from sqlmodel import Session, select

from app.modules.layers.application.queries.data_version_dtos import DataVersionDTO
from app.modules.layers.domain.exceptions import LayerNotFoundException
from app.modules.layers.infrastructure.persistence.mappers.data_version_mapper import (
    DataVersionMapper,
)
from app.modules.layers.infrastructure.persistence.models.data_version_model import (
    DataVersionModel,
)
from app.modules.layers.infrastructure.persistence.models.layer_model import LayerModel


class ListDataVersionsQuery:
    """Consulta para obtener la colección histórica de versiones de datos de una capa."""

    def __init__(self, session: Session) -> None:
        self.session = session

    def execute(self, layer_id: uuid.UUID) -> list[DataVersionDTO]:
        layer = self.session.get(LayerModel, layer_id)
        if layer is None or layer.is_deleted:
            raise LayerNotFoundException(layer_id)

        statement = (
            select(DataVersionModel)
            .where(DataVersionModel.layer_id == layer_id)
            .order_by(DataVersionModel.version_number.desc())
        )
        models = self.session.exec(statement).all()

        active_id = layer.active_data_version_id
        return [
            DataVersionMapper.to_dto(model, is_active=(model.id == active_id))
            for model in models
        ]
