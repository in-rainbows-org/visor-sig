from app.modules.layers.application.queries.layer_dtos import LayerDTO
from app.modules.layers.domain.entities.layer import Layer
from app.modules.layers.domain.enums import GeometryType, LayerColor, LayerKind
from app.modules.layers.infrastructure.persistence.models.layer_model import LayerModel


class LayerMapper:
    """Mapeador bidireccional entre la entidad de dominio Layer, LayerModel y LayerDTO."""

    @staticmethod
    def to_domain(model: LayerModel) -> Layer:
        return Layer(
            id=model.id,
            kind=LayerKind(model.kind),
            name=model.name,
            geometry_type=GeometryType(model.geometry_type),
            color=LayerColor(model.color),
            active_data_version_id=model.active_data_version_id,
            deleted_date=model.deleted_date,
        )

    @staticmethod
    def to_model(entity: Layer, existing_model: LayerModel | None = None) -> LayerModel:
        model = existing_model or LayerModel(id=entity.id)
        model.kind = entity.kind.value if hasattr(entity.kind, "value") else str(entity.kind)
        model.name = entity.name
        model.geometry_type = entity.geometry_type.value if hasattr(entity.geometry_type, "value") else str(entity.geometry_type)
        model.color = entity.color.value if hasattr(entity.color, "value") else str(entity.color)
        model.active_data_version_id = entity.active_data_version_id
        return model

    @staticmethod
    def to_dto(model: LayerModel) -> LayerDTO:
        return LayerDTO(
            id=model.id,
            kind=model.kind,
            name=model.name,
            geometry_type=model.geometry_type,
            color=model.color,
            active_data_version_id=model.active_data_version_id,
            updated_at=model.modified_date,
        )
