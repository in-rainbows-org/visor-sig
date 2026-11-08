import uuid
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any

from app.modules.layers.domain.enums import CodigoFijoStatus


@dataclass(slots=True)
class CodigoFijo:
    """
    Entidad de dominio pura que representa un código fijo (suministro/usuario).
    Sin dependencias de frameworks de persistencia ni HTTP.
    """

    id: uuid.UUID
    longitude: float
    latitude: float
    status: CodigoFijoStatus
    status_changed_at: datetime
    geometry_wkt: str
    data_version_id: uuid.UUID | None = None
    source_feature_id: str | None = None
    label: str | None = None
    sql_code: int | None = None
    sig_code: str | None = None
    fixed_code: int | None = None
    name: str | None = None
    lote_id: uuid.UUID | None = None
    properties: dict[str, Any] = field(default_factory=dict)
