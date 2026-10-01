"use client";

import React, { useCallback } from "react";
import { MapContainer, ZoomControl } from "react-leaflet";
import { cn } from "@/lib/utils";
import {
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
  type MapViewport,
} from "../../domain/models/map.types";
import { HighlightedMapEntity } from "../../domain/models/highlighted-entity.types";
import { useMapFeatures } from "../hooks/use-map-features";
import { useMapView } from "../state/map-view-store";
import { MapBasemap } from "./map-basemap";
import { MapLayerOverlays } from "./map-layer-overlays";
import { MapViewportListener } from "./map-viewport-listener";
import { HighlightedConsultationMarker } from "./elements/highlighted-consultation-marker";

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
  const { visibleLayerKinds, isBasemapVisible, visibleFixedCodeStatuses } = state;
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
        center={DEFAULT_MAP_CENTER}
        zoom={DEFAULT_MAP_ZOOM}
        zoomControl={false}
        preferCanvas={true}
        className="w-full h-full"
      >
        <ZoomControl position="bottomright" />
        <MapBasemap isVisible={isBasemapVisible} />
        <MapViewportListener onViewportChange={handleViewportChange} />
        <MapLayerOverlays
          featuresByKind={featuresByKind}
          layerMetadataByKind={layerMetadataByKind}
          visibleLayerKinds={visibleLayerKinds}
          visibleFixedCodeStatuses={visibleFixedCodeStatuses}
          revision={revision}
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
