import uuid
from abc import ABC, abstractmethod


class CadastralLinker(ABC):
    """
    Puerto para el servicio de geoprocesamiento espacial que vincula
    topológicamente las entidades catastrales (Lotes -> Manzanas, Códigos Fijos -> Lotes).
    """

    @abstractmethod
    def link_lotes_to_manzanas(self, lotes_version_id: uuid.UUID | None = None) -> int:
        """Asocia cada lote a su manzana contenedora en base a su geometría."""

    @abstractmethod
    def link_codigos_fijos_to_lotes(self, codigos_fijos_version_id: uuid.UUID | None = None) -> int:
        """Asocia cada código fijo a su lote contenedor en base a su geometría."""

    @abstractmethod
    def link_all_active(self) -> dict[str, int]:
        """Ejecuta la vinculación completa de las versiones activas actuales."""
