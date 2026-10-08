import uuid
from datetime import datetime, timezone

from app.modules.layers.domain.entities.layer import Layer
from app.modules.layers.domain.enums import GeometryType, LayerColor, LayerKind
from app.modules.layers.infrastructure.persistence.models.layer_model import LayerModel


class LayerMapper:
    """Mapeador bidireccional entre la entidad de dominio Layer y el modelo de persistencia LayerModel."""

    @staticmethod
    def to_domain(model: LayerModel, active_data_version_id: uuid.UUID | None = None) -> Layer:
        return Layer(
            id=model.id,
            kind=LayerKind(model.kind),
            name=model.name,
            geometry_type=GeometryType(model.geometry_type),
            color=LayerColor(model.color),
            active_data_version_id=active_data_version_id,
            is_active=(model.deleted_date is None),
            updated_at=model.modified_date,
        )

    @staticmethod
    def to_model(entity: Layer, existing_model: LayerModel | None = None) -> LayerModel:
        model = existing_model or LayerModel(id=entity.id)
        model.kind = entity.kind.value if hasattr(entity.kind, "value") else str(entity.kind)
        model.name = entity.name
        model.geometry_type = entity.geometry_type.value if hasattr(entity.geometry_type, "value") else str(entity.geometry_type)
        model.color = entity.color.value if hasattr(entity.color, "value") else str(entity.color)
        if not entity.is_active and model.deleted_date is None:
            model.deleted_date = datetime.now(timezone.utc)
        elif entity.is_active:
            model.deleted_date = None
        return model
