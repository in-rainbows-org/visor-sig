from typing import List, Optional, Protocol

from app.modules.consultations.application.queries.consultation_dtos import (
    LayerMetadataDTO,
    PaginatedConsultationResponseDTO,
)


class ConsultationReader(Protocol):
    """
    Puerto secundario CQRS para consultas alfanuméricas sobre capas PostGIS.
    """

    def get_consultation_layers(self) -> List[LayerMetadataDTO]:
        """Obtiene las capas disponibles con sus campos consultables."""
        ...

    def search_entities(
        self,
        layer_kind: str,
        field: Optional[str] = None,
        value: Optional[str] = None,
        page: int = 1,
        page_size: int = 10,
    ) -> PaginatedConsultationResponseDTO:
        """Ejecuta una búsqueda alfanumérica paginada con cálculo de superficie."""
        ...
