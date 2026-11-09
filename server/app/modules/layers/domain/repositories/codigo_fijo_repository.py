import uuid
from abc import ABC, abstractmethod

from app.modules.layers.domain.entities.codigo_fijo import CodigoFijo


class CodigoFijoRepository(ABC):
    """
    Contrato de repositorio de dominio para la entidad CodigoFijo.
    Sin prefijo I, conforme a los principios de arquitectura limpia de la Constitución.
    """

    @abstractmethod
    def get_by_id(self, id: uuid.UUID) -> CodigoFijo | None:
        """Busca un código fijo por su identificador UUID."""

    @abstractmethod
    def find_by_fixed_code(self, fixed_code: int) -> CodigoFijo | None:
        """Busca un código fijo por su código numérico identificador."""

    @abstractmethod
    def save(self, codigo_fijo: CodigoFijo) -> None:
        """Persiste una entidad CodigoFijo."""
