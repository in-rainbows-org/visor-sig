import json
from typing import List, Optional
from uuid import UUID
from geoalchemy2.functions import ST_AsGeoJSON, ST_Intersects, ST_MakeEnvelope
from sqlalchemy import String, func
from sqlmodel import Session, select

from app.modules.layers.infrastructure.persistence.models.codigo_fijo_model import CodigoFijoModel
from app.modules.layers.infrastructure.persistence.models.lote_model import LoteModel
from app.modules.layers.infrastructure.persistence.models.manzana_model import ManzanaModel
from app.modules.layers.infrastructure.persistence.models.via_model import ViaModel
from app.modules.map.application.ports.active_map_features_reader import ActiveMapFeaturesReader
from app.modules.map.application.queries.map_feature_dtos import (
    GeoJsonFeatureCollectionDTO,
    GeoJsonFeatureDTO,
    GeoJsonGeometryDTO,
    MapFeaturePropertiesDTO,
    MapFeaturesResponseDTO,
    MapLayerFeaturesDTO,
    MapLayerLoadStatus,
    MapViewportDTO,
)
from app.modules.layers.domain.enums import LayerKind
from app.modules.layers.infrastructure.persistence.models.layer_model import LayerModel


class SqlModelActiveMapFeaturesReader(ActiveMapFeaturesReader):
    def __init__(self, session: Session):
        self.session = session

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
        viewport_dto = MapViewportDTO(
            west=west,
            south=south,
            east=east,
            north=north,
            zoom=zoom,
        )

        # 1. Obtener los metadatos de las capas solicitadas
        stmt_layers = select(LayerModel).where(
            LayerModel.kind.in_([k.value for k in layer_kinds]),
            LayerModel.deleted_date.is_(None),
        )
        layers = self.session.exec(stmt_layers).all()
        layer_by_kind = {l.kind: l for l in layers}

        layers_dto_list: List[MapLayerFeaturesDTO] = []
        envelope = ST_MakeEnvelope(west, south, east, north, 4326)

        for kind in layer_kinds:
            layer = layer_by_kind.get(kind.value)
            if not layer:
                continue

            active_version_id = layer.active_data_version_id

            if not active_version_id:
                layers_dto_list.append(
                    MapLayerFeaturesDTO(
                        layer_id=layer.id,
                        kind=kind,
                        name=layer.name,
                        color=layer.color,
                        geometry_type=layer.geometry_type,
                        active_data_version_id=None,
                        load_status=MapLayerLoadStatus.NO_ACTIVE_VERSION,
                        min_zoom=self._get_min_zoom(kind),
                        feature_count=0,
                        features=GeoJsonFeatureCollectionDTO(features=[]),
                    )
                )
                continue

            min_zoom = self._get_min_zoom(kind)
            if min_zoom is not None and zoom < min_zoom:
                layers_dto_list.append(
                    MapLayerFeaturesDTO(
                        layer_id=layer.id,
                        kind=kind,
                        name=layer.name,
                        color=layer.color,
                        geometry_type=layer.geometry_type,
                        active_data_version_id=active_version_id,
                        load_status=MapLayerLoadStatus.ZOOM_REQUIRED,
                        min_zoom=min_zoom,
                        feature_count=0,
                        features=GeoJsonFeatureCollectionDTO(features=[]),
                    )
                )
                continue

            # Consultar features y verificar límites con Nivel de Detalle (LoD)
            features_dto, load_status = self._fetch_layer_features(
                kind=kind,
                active_version_id=active_version_id,
                envelope=envelope,
                zoom=zoom,
                fixed_code_statuses=fixed_code_statuses,
            )

            layers_dto_list.append(
                MapLayerFeaturesDTO(
                    layer_id=layer.id,
                    kind=kind,
                    name=layer.name,
                    color=layer.color,
                    geometry_type=layer.geometry_type,
                    active_data_version_id=active_version_id,
                    load_status=load_status,
                    min_zoom=min_zoom,
                    feature_count=len(features_dto.features),
                    features=features_dto,
                )
            )

        return MapFeaturesResponseDTO(
            viewport=viewport_dto,
            layers=layers_dto_list,
        )

    def _get_min_zoom(self, kind: LayerKind) -> Optional[int]:
        if kind == LayerKind.CODIGOS_FIJOS:
            return 13
        if kind == LayerKind.LOTES:
            return 14
        return None

    def _get_max_features_limit(self, kind: LayerKind, zoom: int = 15) -> Optional[int]:
        if kind in (LayerKind.CODIGOS_FIJOS, LayerKind.LOTES):
            return 10000
        return None

    def _fetch_layer_features(
        self,
        kind: LayerKind,
        active_version_id: UUID,
        envelope: Any,
        zoom: int,
        fixed_code_statuses: Optional[List[int]],
    ) -> tuple[GeoJsonFeatureCollectionDTO, MapLayerLoadStatus]:
        if kind == LayerKind.CODIGOS_FIJOS:
            model = CodigoFijoModel
            max_limit = self._get_max_features_limit(kind, zoom)

            stmt = select(
                model.id,
                model.status,
                model.fixed_code,
                model.label,
                ST_AsGeoJSON(model.geometry).label("geojson"),
            ).where(
                model.data_version_id == active_version_id,
                model.deleted_date.is_(None),
                ST_Intersects(model.geometry, envelope),
            )
            if fixed_code_statuses:
                stmt = stmt.where(model.status.in_(fixed_code_statuses))

            if max_limit is not None:
                stmt = stmt.limit(max_limit)

            rows = self.session.exec(stmt).all()
            features: List[GeoJsonFeatureDTO] = []
            for r in rows:
                features.append(
                    GeoJsonFeatureDTO(
                        id=r.id,
                        geometry=GeoJsonGeometryDTO(**json.loads(r.geojson)),
                        properties=MapFeaturePropertiesDTO(
                            id=r.id,
                            status=r.status,
                            fixed_code=r.fixed_code,
                            label=r.label,
                        ),
                    )
                )
            return GeoJsonFeatureCollectionDTO(features=features), MapLayerLoadStatus.READY

        elif kind == LayerKind.LOTES:
            model = LoteModel
            max_limit = self._get_max_features_limit(kind, zoom)

            stmt = select(
                model.id,
                model.lot_number,
                ST_AsGeoJSON(model.geometry).label("geojson"),
            ).where(
                model.data_version_id == active_version_id,
                model.deleted_date.is_(None),
                ST_Intersects(model.geometry, envelope),
            )

            if max_limit is not None:
                stmt = stmt.limit(max_limit)

            rows = self.session.exec(stmt).all()
            features = []
            for r in rows:
                features.append(
                    GeoJsonFeatureDTO(
                        id=r.id,
                        geometry=GeoJsonGeometryDTO(**json.loads(r.geojson)),
                        properties=MapFeaturePropertiesDTO(
                            id=r.id,
                            lot_number=r.lot_number,
                        ),
                    )
                )
            return GeoJsonFeatureCollectionDTO(features=features), MapLayerLoadStatus.READY

        elif kind == LayerKind.MANZANAS:
            model = ManzanaModel
            stmt = select(
                model.id,
                model.uv,
                model.block_number,
                model.uv_block_code,
                ST_AsGeoJSON(model.geometry).label("geojson"),
            ).where(
                model.data_version_id == active_version_id,
                model.deleted_date.is_(None),
                ST_Intersects(model.geometry, envelope),
            )
            rows = self.session.exec(stmt).all()
            features: List[GeoJsonFeatureDTO] = []
            for r in rows:
                features.append(
                    GeoJsonFeatureDTO(
                        id=r.id,
                        geometry=GeoJsonGeometryDTO(**json.loads(r.geojson)),
                        properties=MapFeaturePropertiesDTO(
                            id=r.id,
                            uv=r.uv,
                            block_number=r.block_number,
                            uv_block_code=r.uv_block_code,
                        ),
                    )
                )
            return GeoJsonFeatureCollectionDTO(features=features), MapLayerLoadStatus.READY

        elif kind == LayerKind.VIAS:
            model = ViaModel
            stmt = select(
                model.id,
                model.name,
                model.road_type,
                ST_AsGeoJSON(model.geometry).label("geojson"),
            ).where(
                model.data_version_id == active_version_id,
                model.deleted_date.is_(None),
                ST_Intersects(model.geometry, envelope),
            )
            rows = self.session.exec(stmt).all()
            features: List[GeoJsonFeatureDTO] = []
            for r in rows:
                features.append(
                    GeoJsonFeatureDTO(
                        id=r.id,
                        geometry=GeoJsonGeometryDTO(**json.loads(r.geojson)),
                        properties=MapFeaturePropertiesDTO(
                            id=r.id,
                            name=r.name,
                            road_type=r.road_type,
                        ),
                    )
                )
            return GeoJsonFeatureCollectionDTO(features=features), MapLayerLoadStatus.READY

        return GeoJsonFeatureCollectionDTO(features=[]), MapLayerLoadStatus.READY
