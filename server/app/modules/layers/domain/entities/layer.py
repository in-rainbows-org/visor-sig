import uuid
from dataclasses import dataclass
from datetime import datetime

from app.modules.layers.domain.enums import GeometryType, LayerColor, LayerKind
from app.modules.layers.domain.exceptions import InvalidLayerNameException

KIND_CANONICAL_PROPERTIES: dict[LayerKind, tuple[str, GeometryType]] = {
    LayerKind.CODIGOS_FIJOS: ("Códigos Fijos", GeometryType.POINT),
    LayerKind.LOTES: ("Lotes", GeometryType.POLYGON),
    LayerKind.MANZANAS: ("Manzanas", GeometryType.POLYGON),
    LayerKind.VIAS: ("Vías", GeometryType.LINE),
}


@dataclass(slots=True)
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
    active_data_version_id: uuid.UUID | None = None
    is_active: bool = True
    updated_at: datetime | None = None

    def __post_init__(self) -> None:
        self.name = self._validate_name(self.name)

    @classmethod
    def create(
        cls,
        *,
        kind: LayerKind,
        name: str,
        geometry_type: GeometryType,
        color: LayerColor,
        layer_id: uuid.UUID | None = None,
    ) -> "Layer":
        return cls(
            id=layer_id or uuid.uuid4(),
            kind=kind,
            name=name,
            geometry_type=geometry_type,
            color=color,
            active_data_version_id=None,
            is_active=True,
        )

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

    def set_active_data_version(self, version_id: uuid.UUID | None) -> None:
        self.active_data_version_id = version_id

