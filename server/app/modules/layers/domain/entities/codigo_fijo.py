import uuid
from dataclasses import dataclass
from datetime import datetime
from typing import Optional

from app.modules.layers.domain.enums import CodigoFijoStatus


@dataclass
class CodigoFijo:
    """
    Entidad de dominio pura que representa un código fijo (suministro/usuario).
    Sin dependencias de frameworks de persistencia ni HTTP.
    """

    id: uuid.UUID
    data_version_id: uuid.UUID
    source_feature_id: Optional[str]
    label: Optional[str]
    sql_code: Optional[int]
    sig_code: Optional[str]
    fixed_code: Optional[int]
    name: Optional[str]
    longitude: float
    latitude: float
    status: CodigoFijoStatus
    status_changed_at: datetime
    geometry_wkt: str
