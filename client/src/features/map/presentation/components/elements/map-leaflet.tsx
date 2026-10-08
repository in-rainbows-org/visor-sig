"use client";

import React, { useCallback } from "react";
import { MapContainer } from "react-leaflet";
import { cn } from "@/lib/utils";
import {
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
  type MapViewport,
} from "@/features/map/domain/entities/map.entity";
import type { HighlightedMapEntity } from "@/features/map/domain/entities/highlighted-entity.entity";
import { useMapFeatures } from "@/features/map/presentation/hooks/use-map-features";
import { useMapView } from "@/features/map/presentation/state/map-view-store";
import { MapBasemap } from "./map-basemap";
import { MapLayerOverlays } from "./map-layer-overlays";
import { MapViewportListener } from "./map-viewport-listener";
import { HighlightedConsultationMarker } from "./highlighted-consultation-marker";

export type MapLeafletProps = {
  highlightedEntity?: HighlightedMapEntity | null;
  onClearHighlight?: () => void;
  onSelectEntity?: (entity: HighlightedMapEntity) => void;
};

export function MapLeaflet({
  highlightedEntity,
  onClearHighlight,
  onSelectEntity,
}: MapLeafletProps = {}) {
  const { state, setViewport } = useMapView();
  const {
    visibleLayerKinds,
    isBasemapVisible,
    visibleFixedCodeStatuses,
    macroFeaturesByKind,
    macroLayerMetadataByKind,
  } = state;
  const { featuresByKind, layerMetadataByKind, revision } = useMapFeatures();

  const handleViewportChange = useCallback(
    (nextViewport: MapViewport) => {
      setViewport(nextViewport);
    },
    [setViewport]
  );

  return (
    <div
      className={cn(
        "relative w-full h-full transition-colors duration-300",
        isBasemapVisible ? "bg-slate-100" : "bg-slate-200/90"
      )}
    >
      <MapContainer
        center={
          highlightedEntity && !isNaN(highlightedEntity.lat) && !isNaN(highlightedEntity.lng)
            ? [highlightedEntity.lat, highlightedEntity.lng]
            : DEFAULT_MAP_CENTER
        }
        zoom={
          highlightedEntity && !isNaN(highlightedEntity.lat) && !isNaN(highlightedEntity.lng)
            ? 18
            : DEFAULT_MAP_ZOOM
        }
        zoomControl={false}
        attributionControl={false}
        preferCanvas={true}
        className="w-full h-full"
      >
        <MapBasemap isVisible={isBasemapVisible} />
        <MapViewportListener onViewportChange={handleViewportChange} />
        <MapLayerOverlays
          featuresByKind={featuresByKind}
          layerMetadataByKind={layerMetadataByKind}
          macroFeaturesByKind={macroFeaturesByKind}
          macroLayerMetadataByKind={macroLayerMetadataByKind}
          visibleLayerKinds={visibleLayerKinds}
          visibleFixedCodeStatuses={visibleFixedCodeStatuses}
          revision={revision}
          isIsolated={Boolean(highlightedEntity)}
          onSelectFixedCode={onSelectEntity}
        />
        {highlightedEntity && (
          <HighlightedConsultationMarker
            entity={highlightedEntity}
            onClose={onClearHighlight}
          />
        )}
      </MapContainer>
    </div>
  );
}

export default MapLeaflet;
