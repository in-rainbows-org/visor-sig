import uuid
from dataclasses import dataclass
from datetime import datetime

from app.modules.layers.domain.exceptions import LayerNotFoundException
from app.modules.layers.domain.repositories.data_version_repository import (
    DataVersionRepository,
)
from app.modules.layers.domain.repositories.layer_repository import LayerRepository


@dataclass(frozen=True, slots=True)
class ListDataVersionsQuery:
    """Parámetros de consulta para listar las versiones históricas de una capa."""

    layer_id: uuid.UUID


@dataclass(frozen=True, slots=True)
class DataVersionListItemDTO:
    """DTO inmutable para cada versión en el listado histórico."""

    id: uuid.UUID
    layer_id: uuid.UUID
    version_number: int
    status: str
    source_filename: str
    feature_count: int
    error_message: str | None
    is_active: bool
    created_at: datetime | None


@dataclass(frozen=True, slots=True)
class DataVersionListDTO:
    """DTO envoltorio para la colección de versiones de datos."""

    items: tuple[DataVersionListItemDTO, ...]


class ListDataVersionsQueryHandler:
    """Manejador de consulta para obtener la colección histórica de versiones de datos de una capa."""

    def __init__(
        self,
        data_version_repo: DataVersionRepository,
        layer_repo: LayerRepository,
    ) -> None:
        self.data_version_repo = data_version_repo
        self.layer_repo = layer_repo

    def execute(self, query: ListDataVersionsQuery) -> DataVersionListDTO:
        layer = self.layer_repo.find_by_id(query.layer_id)
        if layer is None or not layer.is_active:
            raise LayerNotFoundException(query.layer_id)

        versions = self.data_version_repo.list_by_layer(query.layer_id)
        items = [
            DataVersionListItemDTO(
                id=v.id,
                layer_id=v.layer_id,
                version_number=v.version_number,
                status=v.status.value if hasattr(v.status, "value") else str(v.status),
                source_filename=v.source_filename,
                feature_count=v.feature_count,
                error_message=v.error_message,
                is_active=(layer.active_data_version_id == v.id),
                created_at=v.created_at,
            )
            for v in versions
        ]
        return DataVersionListDTO(items=tuple(items))
