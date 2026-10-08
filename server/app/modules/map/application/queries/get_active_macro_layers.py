from dataclasses import dataclass

from app.modules.map.application.ports.readers.active_map_features_reader import (
    ActiveMapFeaturesReader,
)
from app.modules.map.application.queries.get_active_map_features import (
    MapLayerFeaturesDTO,
)


@dataclass(frozen=True, slots=True)
class MapMacroLayersDTO:
    """DTO de salida para la consulta completa de capas macro (Manzanas y Vías)."""

    layers: list[MapLayerFeaturesDTO]


@dataclass(frozen=True, slots=True)
class GetActiveMacroLayersQuery:
    """Parámetros de consulta para obtener todas las geometrías de capas macro."""

    pass


class GetActiveMacroLayersQueryHandler:
    """Manejador para obtener los datasets completos de capas macro (Manzanas y Vías)."""

    def __init__(self, reader: ActiveMapFeaturesReader) -> None:
        self.reader = reader

    def execute(self, query: GetActiveMacroLayersQuery | None = None) -> MapMacroLayersDTO:
        return self.reader.get_active_macro_layers()
