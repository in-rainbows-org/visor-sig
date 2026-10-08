from __future__ import annotations

import uuid
from dataclasses import dataclass
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.modules.consultations.application.ports.readers.consultation_reader import (
        ConsultationReader,
    )


@dataclass(frozen=True, slots=True)
class GetViasConsultationQuery:
    """Parámetros de consulta alfanumérica para la capa de Vías."""

    road_type: str | None = None
    name: str | None = None
    page: int = 1
    page_size: int = 10


@dataclass(frozen=True, slots=True)
class ViaConsultationDTO:
    """DTO inmutable para un registro de vía."""

    id: uuid.UUID
    name: str | None
    reference: str | None
    road_type: str | None


@dataclass(frozen=True, slots=True)
class PaginatedViasConsultationDTO:
    """DTO inmutable para el resultado paginado de vías."""

    items: list[ViaConsultationDTO]
    total: int
    page: int
    page_size: int
    total_pages: int


class GetViasConsultationQueryHandler:
    """Manejador de consulta alfanumérica para Vías."""

    def __init__(self, reader: ConsultationReader) -> None:
        self.reader = reader

    def execute(
        self, query: GetViasConsultationQuery
    ) -> PaginatedViasConsultationDTO:
        page = max(query.page, 1)
        page_size = min(max(query.page_size, 1), 100)

        return self.reader.search_vias(
            road_type=query.road_type,
            name=query.name,
            page=page,
            page_size=page_size,
        )
