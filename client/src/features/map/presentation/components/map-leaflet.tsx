"use client";

import React, { useCallback } from "react";
import { MapContainer, ZoomControl } from "react-leaflet";
import { cn } from "@/lib/utils";
import {
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
  type MapViewport,
} from "../../domain/models/map.types";
import { useMapFeatures } from "../hooks/use-map-features";
import { useMapView } from "../state/map-view-store";
import { MapBasemap } from "./map-basemap";
import { MapLayerOverlays } from "./map-layer-overlays";
import { MapViewportListener } from "./map-viewport-listener";

export function MapLeaflet() {
  const { state, setViewport } = useMapView();
  const { visibleLayerKinds, isBasemapVisible } = state;
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
          revision={revision}
        />
      </MapContainer>
    </div>
  );
}

export default MapLeaflet;
