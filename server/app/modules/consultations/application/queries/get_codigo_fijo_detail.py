from __future__ import annotations

import uuid
from dataclasses import dataclass
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.modules.consultations.application.ports.readers.consultation_reader import (
        ConsultationReader,
    )


@dataclass(frozen=True, slots=True)
class GetCodigoFijoByIdQuery:
    """Parámetros de consulta para obtener el detalle de un código fijo por ID."""

    id: uuid.UUID


@dataclass(frozen=True, slots=True)
class CodigoFijoDetailDTO:
    """DTO inmutable para el detalle georreferenciado completo de un código fijo."""

    id: uuid.UUID
    label: str | None
    fixed_code: int | None
    name: str | None
    status: int
    latitude: float
    longitude: float
    lot_number: str | None
    uv: str | None
    block_number: str | None
    uv_block_code: str | None


class GetCodigoFijoByIdQueryHandler:
    """Manejador para obtener el detalle georreferenciado de un código fijo."""

    def __init__(self, reader: ConsultationReader) -> None:
        self.reader = reader

    def execute(self, query: GetCodigoFijoByIdQuery) -> CodigoFijoDetailDTO | None:
        return self.reader.get_codigo_fijo_by_id(query.id)
