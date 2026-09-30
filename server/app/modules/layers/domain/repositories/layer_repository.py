import uuid
from abc import ABC, abstractmethod
from typing import Optional

from app.modules.layers.domain.entities.layer import Layer
from app.modules.layers.domain.enums import LayerKind


class LayerRepository(ABC):
    """
    Contrato de repositorio de dominio para la entidad Layer.
    Sin prefijo I, conforme a los principios de arquitectura limpia de la Constitución.
    """

    @abstractmethod
    def find_by_id(self, layer_id: uuid.UUID) -> Optional[Layer]:
        """Obtiene una capa por su identificador único."""
        pass

    @abstractmethod
    def find_by_kind(self, kind: LayerKind) -> Optional[Layer]:
        """Busca una capa por su tipo canónico (LayerKind)."""
        pass

    @abstractmethod
    def save(self, layer: Layer) -> None:
        """Persiste una entidad Layer (actualización de color o puntero de versión activa)."""
        pass

    @abstractmethod
    def list_layers(self) -> list[Layer]:
        """Lista las cuatro capas fijas del catálogo."""
        pass
