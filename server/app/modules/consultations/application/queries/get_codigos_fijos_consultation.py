from __future__ import annotations

import uuid
from dataclasses import dataclass
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.modules.consultations.application.ports.readers.consultation_reader import (
        ConsultationReader,
    )


@dataclass(frozen=True, slots=True)
class GetCodigosFijosConsultationQuery:
    """Parámetros de consulta alfanumérica para la capa de Códigos Fijos."""

    fixed_code: int | None = None
    name: str | None = None
    page: int = 1
    page_size: int = 10


@dataclass(frozen=True, slots=True)
class CodigoFijoConsultationDTO:
    """DTO inmutable para un registro de código fijo con número de lote."""

    id: uuid.UUID
    label: str | None
    fixed_code: int | None
    name: str | None
    status: int
    lot_number: str | None


@dataclass(frozen=True, slots=True)
class PaginatedCodigosFijosConsultationDTO:
    """DTO inmutable para el resultado paginado de códigos fijos."""

    items: list[CodigoFijoConsultationDTO]
    total: int
    page: int
    page_size: int
    total_pages: int


class GetCodigosFijosConsultationQueryHandler:
    """Manejador de consulta alfanumérica para Códigos Fijos."""

    def __init__(self, reader: ConsultationReader) -> None:
        self.reader = reader

    def execute(
        self, query: GetCodigosFijosConsultationQuery
    ) -> PaginatedCodigosFijosConsultationDTO:
        page = max(query.page, 1)
        page_size = min(max(query.page_size, 1), 100)

        return self.reader.search_codigos_fijos(
            fixed_code=query.fixed_code,
            name=query.name,
            page=page,
            page_size=page_size,
        )
