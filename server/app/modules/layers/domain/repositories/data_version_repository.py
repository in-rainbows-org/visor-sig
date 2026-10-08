import uuid
from abc import ABC, abstractmethod

from app.modules.layers.domain.entities.data_version import DataVersion


class DataVersionRepository(ABC):
    """Contrato de repositorio de dominio para versiones de datos geográficos."""

    @abstractmethod
    def find_by_id(self, version_id: uuid.UUID) -> DataVersion | None:
        """Busca una versión por su ID."""

    @abstractmethod
    def get_next_version_number(self, layer_id: uuid.UUID) -> int:
        """Calcula el siguiente número secuencial de versión para la capa dada."""

    @abstractmethod
    def save(self, version: DataVersion, imported_by_user_id: str | None = None) -> None:
        """Persiste una versión (creación o actualización de estado)."""

    @abstractmethod
    def list_by_layer(self, layer_id: uuid.UUID) -> list[DataVersion]:
        """Lista todas las versiones de una capa ordenadas cronológicamente."""

    @abstractmethod
    def set_active_version(self, layer_id: uuid.UUID, version_id: uuid.UUID) -> None:
        """Marca version_id como activa para layer_id y desactiva las demás."""

    @abstractmethod
    def get_active_version(self, layer_id: uuid.UUID) -> DataVersion | None:
        """Obtiene la versión actualmente activa para la capa."""
