import uuid
from abc import ABC, abstractmethod

from app.modules.layers.domain.entities.layer import Layer
from app.modules.layers.domain.enums import LayerKind


class LayerRepository(ABC):
    """
    Contrato de repositorio de dominio para la entidad Layer.
    Sin prefijo I, conforme a los principios de arquitectura limpia de la Constitución.
    """

    @abstractmethod
    def find_by_id(self, layer_id: uuid.UUID) -> Layer | None:
        """Obtiene una capa por su identificador único."""

    @abstractmethod
    def find_by_kind(self, kind: LayerKind) -> Layer | None:
        """Busca una capa por su tipo canónico (LayerKind)."""

    @abstractmethod
    def save(self, layer: Layer) -> None:
        """Persiste una entidad Layer (actualización de color o puntero de versión activa)."""

    @abstractmethod
    def list_layers(self) -> list[Layer]:
        """Lista las cuatro capas fijas del catálogo."""
