import uuid
from dataclasses import dataclass
from datetime import datetime
from typing import Optional

from app.modules.layers.domain.enums import GeometryType, LayerColor, LayerKind
from app.modules.layers.domain.exceptions import InvalidLayerNameException


KIND_CANONICAL_PROPERTIES: dict[LayerKind, tuple[str, GeometryType]] = {
    LayerKind.CODIGOS_FIJOS: ("Códigos Fijos", GeometryType.POINT),
    LayerKind.LOTES: ("Lotes", GeometryType.POLYGON),
    LayerKind.MANZANAS: ("Manzanas", GeometryType.POLYGON),
    LayerKind.VIAS: ("Vías", GeometryType.LINE),
}


@dataclass
class Layer:
    """
    Entidad de dominio pura que representa una de las cuatro capas cartográficas fijas del sistema.
    Sin dependencias de frameworks de persistencia o APIs.
    """

    id: uuid.UUID
    kind: LayerKind
    name: str
    geometry_type: GeometryType
    color: LayerColor
    active_data_version_id: Optional[uuid.UUID] = None
    deleted_date: Optional[datetime] = None

    def __post_init__(self) -> None:
        self.name = self._validate_name(self.name)

    @staticmethod
    def _validate_name(name: str) -> str:
        if not isinstance(name, str):
            raise InvalidLayerNameException("El nombre debe ser una cadena de texto.")
        clean_name = name.strip()
        if not (1 <= len(clean_name) <= 120):
            raise InvalidLayerNameException("El nombre de la capa debe tener entre 1 y 120 caracteres.")
        return clean_name

    def change_color(self, new_color: LayerColor) -> None:
        self.color = new_color

    def set_active_data_version(self, version_id: Optional[uuid.UUID]) -> None:
        self.active_data_version_id = version_id
