from __future__ import annotations

import uuid
from dataclasses import dataclass
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.modules.consultations.application.ports.readers.consultation_reader import (
        ConsultationReader,
    )


@dataclass(frozen=True, slots=True)
class SearchCodigosFijosForAssignmentQuery:
    """Parámetros para búsqueda especializada de códigos fijos con coordenadas para asignación."""

    fixed_code: int
    limit: int = 10


@dataclass(frozen=True, slots=True)
class CodigoFijoAssignmentCandidateDTO:
    """DTO inmutable para un candidato de código fijo con geolocalización."""

    id: uuid.UUID
    fixed_code: int | None
    name: str | None
    status: int
    latitude: float
    longitude: float


class SearchCodigosFijosForAssignmentQueryHandler:
    """Manejador para la búsqueda especializada de códigos fijos para asignación de rutas."""

    def __init__(self, reader: ConsultationReader) -> None:
        self.reader = reader

    def execute(
        self, query: SearchCodigosFijosForAssignmentQuery
    ) -> list[CodigoFijoAssignmentCandidateDTO]:
        limit = min(max(query.limit, 1), 50)
        return self.reader.search_codigos_fijos_for_assignment(
            fixed_code=query.fixed_code,
            limit=limit,
        )
