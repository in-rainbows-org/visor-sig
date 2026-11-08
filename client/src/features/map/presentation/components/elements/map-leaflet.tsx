"use client";

import React, { useCallback } from "react";
import { MapContainer, useMapEvents } from "react-leaflet";
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

function MapLocationClickListener({
  isSelecting,
  onSelectLocation,
}: {
  isSelecting: boolean;
  onSelectLocation?: (coords: { latitude: number; longitude: number }) => void;
}) {
  useMapEvents({
    click(e) {
      if (!isSelecting) return;
      onSelectLocation?.({
        latitude: Number(e.latlng.lat.toFixed(6)),
        longitude: Number(e.latlng.lng.toFixed(6)),
      });
    },
  });
  return null;
}

export type MapLeafletProps = {
  highlightedEntity?: HighlightedMapEntity | null;
  onClearHighlight?: () => void;
  onSelectEntity?: (entity: HighlightedMapEntity) => void;
  onSelectLocation?: (coords: { latitude: number; longitude: number }) => void;
};

export function MapLeaflet({
  highlightedEntity,
  onClearHighlight,
  onSelectEntity,
  onSelectLocation,
}: MapLeafletProps = {}) {
  const { state, setViewport } = useMapView();
  const {
    visibleLayerKinds,
    activeBasemapId,
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
        className={cn(
          "w-full h-full",
          state.isSelectingFixedCodeLocation &&
            "[&_.leaflet-grab]:!cursor-crosshair [&_.leaflet-interactive]:!cursor-crosshair !cursor-crosshair"
        )}
      >
        <MapLocationClickListener
          isSelecting={state.isSelectingFixedCodeLocation}
          onSelectLocation={onSelectLocation}
        />
        <MapBasemap providerId={activeBasemapId} isVisible={isBasemapVisible} />
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
