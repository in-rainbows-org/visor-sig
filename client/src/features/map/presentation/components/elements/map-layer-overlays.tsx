"use client";

import React from "react";
import { GeoJSON } from "react-leaflet";
import type { PathOptions } from "leaflet";
import type { GeoJsonObject } from "geojson";
import { LAYER_COLOR_MAP } from "@/features/layers/presentation/components/elements/layer-theme-helper";
import type {
  LayerKind,
  MapGeoJsonFeatureCollection,
  MapLayerFeatures,
} from "@/features/map/domain/entities/map.entity";
import type { HighlightedMapEntity } from "@/features/map/domain/entities/highlighted-entity.entity";
import { ProgressiveFixedCodesLayer } from "./progressive-fixed-codes-layer";
import { ProgressiveLotesLayer } from "./progressive-lotes-layer";

export type MapLayerOverlaysProps = {
  featuresByKind: Partial<Record<LayerKind, MapGeoJsonFeatureCollection>>;
  layerMetadataByKind: Partial<Record<LayerKind, MapLayerFeatures>>;
  macroFeaturesByKind?: Partial<Record<"MANZANAS" | "VIAS", MapGeoJsonFeatureCollection>>;
  macroLayerMetadataByKind?: Partial<Record<"MANZANAS" | "VIAS", MapLayerFeatures>>;
  visibleLayerKinds: Set<LayerKind>;
  visibleFixedCodeStatuses?: Set<number>;
  revision?: number;
  isIsolated?: boolean;
  onSelectFixedCode?: (entity: HighlightedMapEntity) => void;
};

export function MapLayerOverlays({
  featuresByKind,
  layerMetadataByKind,
  macroFeaturesByKind,
  macroLayerMetadataByKind,
  visibleLayerKinds,
  visibleFixedCodeStatuses,
  revision = 0,
  isIsolated = false,
  onSelectFixedCode,
}: MapLayerOverlaysProps) {
  const viasFeatures = macroFeaturesByKind?.VIAS ?? featuresByKind.VIAS;
  const viasMeta = macroLayerMetadataByKind?.VIAS ?? layerMetadataByKind.VIAS;
  const manzanasFeatures = macroFeaturesByKind?.MANZANAS ?? featuresByKind.MANZANAS;
  const manzanasMeta = macroLayerMetadataByKind?.MANZANAS ?? layerMetadataByKind.MANZANAS;

  return (
    <>
      {/* MANZANAS (Polígonos macro en memoria - capa base) */}
      {visibleLayerKinds.has("MANZANAS") &&
        manzanasFeatures &&
        manzanasFeatures.features.length > 0 && (
          <GeoJSON
            key={`manzanas-macro-${manzanasMeta?.activeDataVersionId ?? "v"}-${manzanasFeatures.features.length}`}
            data={manzanasFeatures as unknown as GeoJsonObject}
            style={() => {
              const colorEnum = manzanasMeta?.color ?? "GREEN";
              const hex = LAYER_COLOR_MAP[colorEnum]?.hex ?? "#059669";
              return {
                color: hex,
                weight: 2,
                fillColor: hex,
                fillOpacity: 0.15,
                opacity: 0.85,
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

      {/* VÍAS (Líneas macro en memoria - sobre los polígonos de manzanas y lotes) */}
      {visibleLayerKinds.has("VIAS") &&
        viasFeatures &&
        viasFeatures.features.length > 0 && (
          <GeoJSON
            key={`vias-macro-${viasMeta?.activeDataVersionId ?? "v"}-${viasFeatures.features.length}`}
            data={viasFeatures as unknown as GeoJsonObject}
            style={() => {
              const colorEnum = viasMeta?.color ?? "VIOLET";
              const hex = LAYER_COLOR_MAP[colorEnum]?.hex ?? "#7c3aed";
              return {
                color: hex,
                weight: 3.5,
                opacity: 0.9,
              } as PathOptions;
            }}
          />
        )}

      {/* CÓDIGOS FIJOS (Puntos con carga progresiva radial de adentro hacia afuera y LoD) */}
      {visibleLayerKinds.has("CODIGOS_FIJOS") &&
        featuresByKind.CODIGOS_FIJOS &&
        featuresByKind.CODIGOS_FIJOS.features.length > 0 && (
          <ProgressiveFixedCodesLayer
            key={`codigos-rev${revision}-${layerMetadataByKind.CODIGOS_FIJOS?.activeDataVersionId ?? "v"}-${featuresByKind.CODIGOS_FIJOS.features.length}`}
            features={featuresByKind.CODIGOS_FIJOS.features}
            visibleFixedCodeStatuses={visibleFixedCodeStatuses}
            versionId={layerMetadataByKind.CODIGOS_FIJOS?.activeDataVersionId}
            revision={revision}
            isIsolated={isIsolated}
            onSelectFixedCode={onSelectFixedCode}
          />
        )}
    </>
  );
}
