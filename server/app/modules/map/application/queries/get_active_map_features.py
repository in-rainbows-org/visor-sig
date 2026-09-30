from typing import List, Optional
from app.modules.map.application.ports.active_map_features_reader import ActiveMapFeaturesReader
from app.modules.map.application.queries.map_feature_dtos import MapFeaturesResponseDTO
from app.modules.layers.domain.enums import LayerKind


class GetActiveMapFeaturesQuery:
    def __init__(self, reader: ActiveMapFeaturesReader):
        self.reader = reader

    def execute(
        self,
        layer_kinds: List[LayerKind],
        west: float,
        south: float,
        east: float,
        north: float,
        zoom: int,
        fixed_code_statuses: Optional[List[int]] = None,
    ) -> MapFeaturesResponseDTO:
        return self.reader.get_features_by_viewport(
            layer_kinds=layer_kinds,
            west=west,
            south=south,
            east=east,
            north=north,
            zoom=zoom,
            fixed_code_statuses=fixed_code_statuses,
        )
