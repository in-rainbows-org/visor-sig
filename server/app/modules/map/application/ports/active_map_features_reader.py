from abc import ABC, abstractmethod
from typing import List, Optional
from app.modules.map.application.queries.map_feature_dtos import MapFeaturesResponseDTO
from app.modules.layers.domain.enums import LayerKind


class ActiveMapFeaturesReader(ABC):
    @abstractmethod
    def get_features_by_viewport(
        self,
        layer_kinds: List[LayerKind],
        west: float,
        south: float,
        east: float,
        north: float,
        zoom: int,
        fixed_code_statuses: Optional[List[int]] = None,
    ) -> MapFeaturesResponseDTO:
        """Obtiene las colecciones GeoJSON de las versiones activas de las capas solicitadas."""
        pass
