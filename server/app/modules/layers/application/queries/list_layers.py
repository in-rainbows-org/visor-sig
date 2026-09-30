from sqlmodel import Session, select

from app.modules.layers.application.queries.layer_dtos import LayerDTO
from app.modules.layers.infrastructure.persistence.mappers.layer_mapper import LayerMapper
from app.modules.layers.infrastructure.persistence.models.layer_model import LayerModel


class ListLayersQuery:
    """Consulta para listar las cuatro capas del catálogo fijo."""

    def __init__(self, session: Session) -> None:
        self.session = session

    def execute(self) -> list[LayerDTO]:
        statement = (
            select(LayerModel)
            .where(LayerModel.deleted_date.is_(None))
            .order_by(LayerModel.name.asc())
        )
        models = self.session.exec(statement).all()
        return [LayerMapper.to_dto(m) for m in models]
