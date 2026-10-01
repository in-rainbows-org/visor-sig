from typing import Optional

from app.modules.consultations.application.ports.consultation_reader import ConsultationReader
from app.modules.consultations.application.queries.consultation_dtos import PaginatedConsultationResponseDTO


class SearchEntitiesQuery:
    def __init__(self, reader: ConsultationReader):
        self.reader = reader

    def execute(
        self,
        layer_kind: str,
        field: Optional[str] = None,
        value: Optional[str] = None,
        page: int = 1,
        page_size: int = 10,
    ) -> PaginatedConsultationResponseDTO:
        return self.reader.search_entities(
            layer_kind=layer_kind,
            field=field,
            value=value,
            page=page,
            page_size=page_size,
        )
