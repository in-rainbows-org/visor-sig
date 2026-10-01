from typing import List

from app.modules.consultations.application.ports.consultation_reader import ConsultationReader
from app.modules.consultations.application.queries.consultation_dtos import LayerMetadataDTO


class GetConsultationMetadataQuery:
    def __init__(self, reader: ConsultationReader):
        self.reader = reader

    def execute(self) -> List[LayerMetadataDTO]:
        return self.reader.get_consultation_layers()
