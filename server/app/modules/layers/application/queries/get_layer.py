import uuid
from sqlmodel import Session, select

from app.modules.layers.application.queries.layer_dtos import LayerDTO
from app.modules.layers.domain.exceptions import LayerNotFoundException
from app.modules.layers.infrastructure.persistence.mappers.layer_mapper import LayerMapper
from app.modules.layers.infrastructure.persistence.models.layer_model import LayerModel


class GetLayerQuery:
    """Consulta para obtener los detalles de una capa por su ID."""

    def __init__(self, session: Session) -> None:
        self.session = session

    def execute(self, layer_id: uuid.UUID) -> LayerDTO:
        statement = select(LayerModel).where(LayerModel.id == layer_id)
        model = self.session.exec(statement).first()
        if not model:
            raise LayerNotFoundException(layer_id)
        return LayerMapper.to_dto(model)
