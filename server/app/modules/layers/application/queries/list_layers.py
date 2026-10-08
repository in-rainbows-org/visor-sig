import uuid
from dataclasses import dataclass
from datetime import datetime

from app.modules.layers.domain.repositories.layer_repository import LayerRepository


@dataclass(frozen=True, slots=True)
class ListLayersQuery:
    """Parámetros de consulta para listar las capas del catálogo fijo."""


@dataclass(frozen=True, slots=True)
class LayerListItemDTO:
    """DTO inmutable para cada elemento de la colección de capas."""

    id: uuid.UUID
    kind: str
    name: str
    geometry_type: str
    color: str
    active_data_version_id: uuid.UUID | None
    updated_at: datetime | None


@dataclass(frozen=True, slots=True)
class LayerListDTO:
    """DTO envoltorio para la colección de capas."""

    items: tuple[LayerListItemDTO, ...]


class ListLayersQueryHandler:
    """Manejador de consulta para listar las cuatro capas del catálogo fijo."""

    def __init__(self, layer_repo: LayerRepository) -> None:
        self.layer_repo = layer_repo

    def execute(self, query: ListLayersQuery | None = None) -> LayerListDTO:
        layers = self.layer_repo.list_layers()
        items = [
            LayerListItemDTO(
                id=l.id,
                kind=l.kind.value if hasattr(l.kind, "value") else str(l.kind),
                name=l.name,
                geometry_type=l.geometry_type.value if hasattr(l.geometry_type, "value") else str(l.geometry_type),
                color=l.color.value if hasattr(l.color, "value") else str(l.color),
                active_data_version_id=l.active_data_version_id,
                updated_at=l.updated_at,
            )
            for l in layers
            if l.is_active
        ]
        return LayerListDTO(items=tuple(items))
