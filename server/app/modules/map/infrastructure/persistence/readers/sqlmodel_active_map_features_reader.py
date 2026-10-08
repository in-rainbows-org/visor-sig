import json
from typing import Any
from uuid import UUID

from app.modules.layers.domain.enums import LayerKind
from app.modules.layers.infrastructure.persistence.models.codigo_fijo_model import (
    CodigoFijoModel,
)
from app.modules.layers.infrastructure.persistence.models.data_version_model import (
    DataVersionModel,
)
from app.modules.layers.infrastructure.persistence.models.layer_model import LayerModel
from app.modules.layers.infrastructure.persistence.models.lote_model import LoteModel
from app.modules.layers.infrastructure.persistence.models.manzana_model import (
    ManzanaModel,
)
from app.modules.layers.infrastructure.persistence.models.via_model import ViaModel
from app.modules.map.application.ports.readers.active_map_features_reader import (
    ActiveMapFeaturesReader,
)
from app.modules.map.application.queries.get_active_macro_layers import (
    MapMacroLayersDTO,
)
from app.modules.map.application.queries.get_active_map_features import (
    GeoJsonFeatureCollectionDTO,
    GeoJsonFeatureDTO,
    GeoJsonGeometryDTO,
    MapFeaturePropertiesDTO,
    MapFeaturesDTO,
    MapLayerFeaturesDTO,
    MapViewportDTO,
)
from app.modules.map.domain.enums import MapLayerLoadStatus
from geoalchemy2.functions import ST_AsGeoJSON, ST_Intersects, ST_MakeEnvelope
from sqlmodel import Session, select


class SqlModelActiveMapFeaturesReader(ActiveMapFeaturesReader):
    def __init__(self, session: Session):
        self.session = session

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

        stmt_active = select(DataVersionModel.layer_id, DataVersionModel.id).where(
            DataVersionModel.is_active.is_(True),
            DataVersionModel.deleted_date.is_(None),
        )
        active_versions = dict(self.session.exec(stmt_active).all())

        layers_dto_list: list[MapLayerFeaturesDTO] = []
        envelope = ST_MakeEnvelope(west, south, east, north, 4326)

        for kind in layer_kinds:
            layer = layer_by_kind.get(kind.value)
            if not layer:
                continue

            active_version_id = active_versions.get(layer.id)

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

        return MapFeaturesDTO(
            viewport=viewport_dto,
            layers=layers_dto_list,
        )

    def _get_min_zoom(self, kind: LayerKind) -> int | None:
        if kind == LayerKind.CODIGOS_FIJOS:
            return 13
        if kind == LayerKind.LOTES:
            return 14
        return None

    def _get_max_features_limit(self, kind: LayerKind, zoom: int = 15) -> int | None:
        if kind in (LayerKind.CODIGOS_FIJOS, LayerKind.LOTES):
            return 10000
        return None

    def _fetch_layer_features(
        self,
        kind: LayerKind,
        active_version_id: UUID,
        envelope: Any,
        zoom: int,
        fixed_code_statuses: list[int] | None,
    ) -> tuple[GeoJsonFeatureCollectionDTO, MapLayerLoadStatus]:
        if kind == LayerKind.CODIGOS_FIJOS:
            if fixed_code_statuses is not None and len(fixed_code_statuses) == 0:
                return GeoJsonFeatureCollectionDTO(features=[]), MapLayerLoadStatus.READY

            model = CodigoFijoModel
            max_limit = self._get_max_features_limit(kind, zoom)

            stmt = select(
                model.id,
                model.status,
                model.fixed_code,
                model.label,
                model.name,
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
            features: list[GeoJsonFeatureDTO] = []
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
                            name=r.name,
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
            features: list[GeoJsonFeatureDTO] = []
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
            features: list[GeoJsonFeatureDTO] = []
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
            features: list[GeoJsonFeatureDTO] = []
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

    def get_active_macro_layers(self) -> MapMacroLayersDTO:
        macro_kinds = [LayerKind.MANZANAS, LayerKind.VIAS]
        stmt_layers = select(LayerModel).where(
            LayerModel.kind.in_([k.value for k in macro_kinds]),
            LayerModel.deleted_date.is_(None),
        )
        layers = self.session.exec(stmt_layers).all()
        layer_by_kind = {l.kind: l for l in layers}

        stmt_active = select(DataVersionModel.layer_id, DataVersionModel.id).where(
            DataVersionModel.is_active.is_(True),
            DataVersionModel.deleted_date.is_(None),
        )
        active_versions = dict(self.session.exec(stmt_active).all())

        layers_dto_list: list[MapLayerFeaturesDTO] = []

        for kind in macro_kinds:
            layer = layer_by_kind.get(kind.value)
            if not layer:
                continue

            active_version_id = active_versions.get(layer.id)
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
                        min_zoom=None,
                        feature_count=0,
                        features=GeoJsonFeatureCollectionDTO(features=[]),
                    )
                )
                continue

            features: list[GeoJsonFeatureDTO] = []
            if kind == LayerKind.MANZANAS:
                stmt = select(
                    ManzanaModel.id,
                    ManzanaModel.uv,
                    ManzanaModel.block_number,
                    ManzanaModel.uv_block_code,
                    ST_AsGeoJSON(ManzanaModel.geometry).label("geojson"),
                ).where(
                    ManzanaModel.data_version_id == active_version_id,
                    ManzanaModel.deleted_date.is_(None),
                )
                rows = self.session.exec(stmt).all()
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
            elif kind == LayerKind.VIAS:
                stmt = select(
                    ViaModel.id,
                    ViaModel.name,
                    ViaModel.road_type,
                    ST_AsGeoJSON(ViaModel.geometry).label("geojson"),
                ).where(
                    ViaModel.data_version_id == active_version_id,
                    ViaModel.deleted_date.is_(None),
                )
                rows = self.session.exec(stmt).all()
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

            layers_dto_list.append(
                MapLayerFeaturesDTO(
                    layer_id=layer.id,
                    kind=kind,
                    name=layer.name,
                    color=layer.color,
                    geometry_type=layer.geometry_type,
                    active_data_version_id=active_version_id,
                    load_status=MapLayerLoadStatus.READY,
                    min_zoom=None,
                    feature_count=len(features),
                    features=GeoJsonFeatureCollectionDTO(features=features),
                )
            )

        return MapMacroLayersDTO(layers=layers_dto_list)
