from __future__ import annotations

import uuid
from dataclasses import dataclass
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.modules.consultations.application.ports.readers.consultation_reader import (
        ConsultationReader,
    )


@dataclass(frozen=True, slots=True)
class GetLotesConsultationQuery:
    """Parámetros de consulta alfanumérica para la capa de Lotes."""

    lot_number: str | None = None
    page: int = 1
    page_size: int = 10


@dataclass(frozen=True, slots=True)
class LoteConsultationDTO:
    """DTO inmutable para un registro de lote con código de manzana asociado."""

    id: uuid.UUID
    lot_number: str | None
    manzana_uv_block_code: str | None


@dataclass(frozen=True, slots=True)
class PaginatedLotesConsultationDTO:
    """DTO inmutable para el resultado paginado de lotes."""

    items: list[LoteConsultationDTO]
    total: int
    page: int
    page_size: int
    total_pages: int


class GetLotesConsultationQueryHandler:
    """Manejador de consulta alfanumérica para Lotes."""

    def __init__(self, reader: ConsultationReader) -> None:
        self.reader = reader

    def execute(
        self, query: GetLotesConsultationQuery
    ) -> PaginatedLotesConsultationDTO:
        page = max(query.page, 1)
        page_size = min(max(query.page_size, 1), 100)

        return self.reader.search_lotes(
            lot_number=query.lot_number,
            page=page,
            page_size=page_size,
        )
