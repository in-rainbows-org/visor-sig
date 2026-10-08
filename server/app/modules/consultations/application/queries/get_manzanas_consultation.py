from __future__ import annotations

import uuid
from dataclasses import dataclass
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.modules.consultations.application.ports.readers.consultation_reader import (
        ConsultationReader,
    )


@dataclass(frozen=True, slots=True)
class GetManzanasConsultationQuery:
    """Parámetros de consulta alfanumérica para la capa de Manzanas."""

    uv_block_code: str | None = None
    uv: str | None = None
    block_number: str | None = None
    page: int = 1
    page_size: int = 10


@dataclass(frozen=True, slots=True)
class ManzanaConsultationDTO:
    """DTO inmutable para un registro de manzana."""

    id: uuid.UUID
    uv_block_code: str | None
    uv: str | None
    block_number: str | None


@dataclass(frozen=True, slots=True)
class PaginatedManzanasConsultationDTO:
    """DTO inmutable para el resultado paginado de manzanas."""

    items: list[ManzanaConsultationDTO]
    total: int
    page: int
    page_size: int
    total_pages: int


class GetManzanasConsultationQueryHandler:
    """Manejador de consulta alfanumérica para Manzanas."""

    def __init__(self, reader: ConsultationReader) -> None:
        self.reader = reader

    def execute(
        self, query: GetManzanasConsultationQuery
    ) -> PaginatedManzanasConsultationDTO:
        page = max(query.page, 1)
        page_size = min(max(query.page_size, 1), 100)

        return self.reader.search_manzanas(
            uv_block_code=query.uv_block_code,
            uv=query.uv,
            block_number=query.block_number,
            page=page,
            page_size=page_size,
        )
