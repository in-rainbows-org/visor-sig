import uuid
from sqlmodel import Session

from app.modules.layers.application.queries.data_version_dtos import DataVersionDTO
from app.modules.layers.domain.exceptions import DataVersionNotFoundException, LayerNotFoundException
from app.modules.layers.infrastructure.persistence.mappers.data_version_mapper import (
    DataVersionMapper,
)
from app.modules.layers.infrastructure.persistence.models.data_version_model import (
    DataVersionModel,
)
from app.modules.layers.infrastructure.persistence.models.layer_model import LayerModel


class GetDataVersionQuery:
    """Consulta para obtener los metadatos de una versión de datos específica."""

    def __init__(self, session: Session) -> None:
        self.session = session

    def execute(self, layer_id: uuid.UUID, version_id: uuid.UUID) -> DataVersionDTO:
        layer = self.session.get(LayerModel, layer_id)
        if layer is None or layer.is_deleted:
            raise LayerNotFoundException(layer_id)

        model = self.session.get(DataVersionModel, version_id)
        if model is None or model.layer_id != layer_id:
            raise DataVersionNotFoundException(version_id)

        is_active = layer.active_data_version_id == model.id
        return DataVersionMapper.to_dto(model, is_active=is_active)
