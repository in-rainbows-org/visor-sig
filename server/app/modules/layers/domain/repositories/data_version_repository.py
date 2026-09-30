import uuid
from abc import ABC, abstractmethod
from typing import Optional

from app.modules.layers.domain.entities.data_version import DataVersion


class DataVersionRepository(ABC):
    """Contrato de repositorio de dominio para versiones de datos geográficos."""

    @abstractmethod
    def find_by_id(self, version_id: uuid.UUID) -> Optional[DataVersion]:
        """Busca una versión por su ID."""
        pass

    @abstractmethod
    def get_next_version_number(self, layer_id: uuid.UUID) -> int:
        """Calcula el siguiente número secuencial de versión para la capa dada."""
        pass

    @abstractmethod
    def save(self, version: DataVersion, imported_by_user_id: Optional[str] = None) -> None:
        """Persiste una versión (creación o actualización de estado)."""
        pass

    @abstractmethod
    def list_by_layer(self, layer_id: uuid.UUID) -> list[DataVersion]:
        """Lista todas las versiones de una capa ordenadas cronológicamente."""
        pass
