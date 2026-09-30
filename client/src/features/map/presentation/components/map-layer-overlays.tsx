"use client";

import React from "react";
import { GeoJSON } from "react-leaflet";
import type { PathOptions } from "leaflet";
import type { GeoJsonObject } from "geojson";
import { LAYER_COLOR_MAP } from "@/features/layers/presentation/components/layer-theme-helper";
import type {
  LayerKind,
  MapGeoJsonFeatureCollection,
  MapLayerFeatures,
} from "../../domain/models/map.types";
import { ProgressiveFixedCodesLayer } from "./progressive-fixed-codes-layer";
import { ProgressiveLotesLayer } from "./progressive-lotes-layer";

export type MapLayerOverlaysProps = {
  featuresByKind: Partial<Record<LayerKind, MapGeoJsonFeatureCollection>>;
  layerMetadataByKind: Partial<Record<LayerKind, MapLayerFeatures>>;
  visibleLayerKinds: Set<LayerKind>;
  revision?: number;
};

export function MapLayerOverlays({
  featuresByKind,
  layerMetadataByKind,
  visibleLayerKinds,
  revision = 0,
}: MapLayerOverlaysProps) {
  return (
    <>
      {/* VÍAS (Líneas) */}
      {visibleLayerKinds.has("VIAS") &&
        featuresByKind.VIAS &&
        featuresByKind.VIAS.features.length > 0 && (
          <GeoJSON
            key={`vias-rev${revision}-${layerMetadataByKind.VIAS?.activeDataVersionId ?? "v"}-${featuresByKind.VIAS.features.length}`}
            data={featuresByKind.VIAS as unknown as GeoJsonObject}
            style={() => {
              const colorEnum = layerMetadataByKind.VIAS?.color ?? "BLUE";
              const hex = LAYER_COLOR_MAP[colorEnum]?.hex ?? "#2563eb";
              return {
                color: hex,
                weight: 3.5,
                opacity: 0.85,
              } as PathOptions;
            }}
          />
        )}

      {/* MANZANAS (Polígonos) */}
      {visibleLayerKinds.has("MANZANAS") &&
        featuresByKind.MANZANAS &&
        featuresByKind.MANZANAS.features.length > 0 && (
          <GeoJSON
            key={`manzanas-rev${revision}-${layerMetadataByKind.MANZANAS?.activeDataVersionId ?? "v"}-${featuresByKind.MANZANAS.features.length}`}
            data={featuresByKind.MANZANAS as unknown as GeoJsonObject}
            style={() => {
              const colorEnum = layerMetadataByKind.MANZANAS?.color ?? "ORANGE";
              const hex = LAYER_COLOR_MAP[colorEnum]?.hex ?? "#ea580c";
              return {
                color: hex,
                weight: 2,
                fillColor: hex,
                fillOpacity: 0.15,
                opacity: 0.8,
              } as PathOptions;
            }}
          />
        )}

      {/* LOTES (Polígonos con carga progresiva radial y canvas no bloqueante) */}
      {visibleLayerKinds.has("LOTES") &&
        featuresByKind.LOTES &&
        featuresByKind.LOTES.features.length > 0 && (
          <ProgressiveLotesLayer
            key={`lotes-rev${revision}-${layerMetadataByKind.LOTES?.activeDataVersionId ?? "v"}-${featuresByKind.LOTES.features.length}`}
            features={featuresByKind.LOTES.features}
            color={layerMetadataByKind.LOTES?.color}
            versionId={layerMetadataByKind.LOTES?.activeDataVersionId}
            revision={revision}
          />
        )}

      {/* CÓDIGOS FIJOS (Puntos con carga progresiva radial de adentro hacia afuera y LoD) */}
      {visibleLayerKinds.has("CODIGOS_FIJOS") &&
        featuresByKind.CODIGOS_FIJOS &&
        featuresByKind.CODIGOS_FIJOS.features.length > 0 && (
          <ProgressiveFixedCodesLayer
            key={`codigos-rev${revision}-${layerMetadataByKind.CODIGOS_FIJOS?.activeDataVersionId ?? "v"}-${featuresByKind.CODIGOS_FIJOS.features.length}`}
            features={featuresByKind.CODIGOS_FIJOS.features}
            versionId={layerMetadataByKind.CODIGOS_FIJOS?.activeDataVersionId}
            revision={revision}
          />
        )}
    </>
  );
}
