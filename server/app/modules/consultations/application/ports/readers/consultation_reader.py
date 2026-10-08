import uuid
from abc import ABC, abstractmethod

from app.modules.consultations.application.queries.get_codigo_fijo_detail import (
    CodigoFijoDetailDTO,
)
from app.modules.consultations.application.queries.get_codigos_fijos_consultation import (
    PaginatedCodigosFijosConsultationDTO,
)
from app.modules.consultations.application.queries.get_lotes_consultation import (
    PaginatedLotesConsultationDTO,
)
from app.modules.consultations.application.queries.get_manzanas_consultation import (
    PaginatedManzanasConsultationDTO,
)
from app.modules.consultations.application.queries.get_vias_consultation import (
    PaginatedViasConsultationDTO,
)


class ConsultationReader(ABC):
    """
    Puerto secundario CQRS para consultas alfanuméricas especializadas por capa cartográfica.
    """

    @abstractmethod
    def search_codigos_fijos(
        self,
        fixed_code: int | None,
        name: str | None,
        page: int,
        page_size: int,
    ) -> PaginatedCodigosFijosConsultationDTO:
        """Consulta alfanumérica paginada de códigos fijos con resolución del número de lote."""

    @abstractmethod
    def get_codigo_fijo_by_id(
        self,
        id: uuid.UUID,
    ) -> CodigoFijoDetailDTO | None:
        """Obtiene el detalle georreferenciado completo de un código fijo por ID con lote y manzana."""


    @abstractmethod
    def search_lotes(
        self,
        lot_number: str | None,
        page: int,
        page_size: int,
    ) -> PaginatedLotesConsultationDTO:
        """Consulta alfanumérica paginada de lotes con resolución de código de manzana."""

    @abstractmethod
    def search_manzanas(
        self,
        uv_block_code: str | None,
        uv: str | None,
        block_number: str | None,
        page: int,
        page_size: int,
    ) -> PaginatedManzanasConsultationDTO:
        """Consulta alfanumérica paginada de manzanas catastrales."""

    @abstractmethod
    def search_vias(
        self,
        road_type: str | None,
        name: str | None,
        page: int,
        page_size: int,
    ) -> PaginatedViasConsultationDTO:
        """Consulta alfanumérica paginada de vías y calles públicas."""
