from __future__ import annotations

from abc import ABC, abstractmethod
from typing import TYPE_CHECKING

from app.modules.layers.domain.enums import LayerKind

if TYPE_CHECKING:
    from app.modules.map.application.queries.get_active_macro_layers import (
        MapMacroLayersDTO,
    )
    from app.modules.map.application.queries.get_active_map_features import (
        MapFeaturesDTO,
    )


class ActiveMapFeaturesReader(ABC):
    """Puerto secundario para la lectura analítica y geoespacial del visor de mapas."""

    @abstractmethod
    def get_features_by_viewport(
        self,
        layer_kinds: list[LayerKind],
        west: float,
        south: float,
        east: float,
        north: float,
        zoom: int,
        fixed_code_statuses: list[int] | None = None,
    ) -> MapFeaturesDTO:
        """Obtiene las colecciones GeoJSON de las versiones activas de las capas solicitadas por viewport."""
        pass

    @abstractmethod
    def get_active_macro_layers(self) -> MapMacroLayersDTO:
        """Obtiene las colecciones GeoJSON completas de las versiones activas de Manzanas y Vías."""
        pass

