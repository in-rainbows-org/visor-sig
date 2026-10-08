"use client";
 
import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import type { FixedCodeStatusValue } from "../../domain/entities/fixed-code-status.entity";
import type {
  LayerKind,
  MapGeoJsonFeatureCollection,
  MapLayerFeatures,
  MapLayerLoadStatus,
  MapViewport,
  MobileSearchFilterType,
  MobileSubHeaderTab,
  ViewSegmentOption,
} from "../../domain/entities/map.entity";
import {
  initialMapViewState,
  mapViewReducer,
  type MapViewState,
} from "./map-view-reducer";

export type MapViewContextType = {
  state: MapViewState;
  setViewport: (viewport: MapViewport) => void;
  toggleLayer: (kind: LayerKind) => void;
  setLayerVisibility: (kind: LayerKind, visible: boolean) => void;
  toggleFixedCodeStatus: (status: FixedCodeStatusValue) => void;
  setAllFixedCodeStatuses: (visible: boolean) => void;
  toggleBasemap: () => void;
  setBasemapVisible: (visible: boolean) => void;
  setActiveTab: (tab: ViewSegmentOption) => void;
  setMobileSubHeaderTab: (tab: MobileSubHeaderTab) => void;
  setMobileSearchFilter: (filter: MobileSearchFilterType) => void;
  setLayerLoadStatus: (
    kind: LayerKind,
    loadStatus: MapLayerLoadStatus,
    featureCount: number,
    minZoom: number | null,
    activeDataVersionId: string | null,
    error?: string | null
  ) => void;
  setInitialLoading: (loading: boolean) => void;
  setMacroLayers: (
    featuresByKind: Partial<Record<"MANZANAS" | "VIAS", MapGeoJsonFeatureCollection>>,
    metadataByKind: Partial<Record<"MANZANAS" | "VIAS", MapLayerFeatures>>
  ) => void;
  setMacroLayersLoading: (loading: boolean) => void;
  registerZoomHandlers: (zoomIn: () => void, zoomOut: () => void) => void;
  zoomIn: () => void;
  zoomOut: () => void;
};

const MapViewContext = createContext<MapViewContextType | null>(null);

export function MapViewProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(mapViewReducer, initialMapViewState);
  const zoomInRef = React.useRef<() => void>(() => {});
  const zoomOutRef = React.useRef<() => void>(() => {});

  const registerZoomHandlers = useCallback(
    (zoomInFn: () => void, zoomOutFn: () => void) => {
      zoomInRef.current = zoomInFn;
      zoomOutRef.current = zoomOutFn;
    },
    []
  );

  const zoomIn = useCallback(() => {
    zoomInRef.current();
  }, []);

  const zoomOut = useCallback(() => {
    zoomOutRef.current();
  }, []);

  const setViewport = useCallback((viewport: MapViewport) => {
    dispatch({ type: "SET_VIEWPORT", payload: viewport });
  }, []);

  const toggleLayer = useCallback((kind: LayerKind) => {
    dispatch({ type: "TOGGLE_LAYER", payload: kind });
  }, []);

  const setLayerVisibility = useCallback((kind: LayerKind, visible: boolean) => {
    dispatch({ type: "SET_LAYER_VISIBILITY", payload: { kind, visible } });
  }, []);

  const toggleFixedCodeStatus = useCallback((status: FixedCodeStatusValue) => {
    dispatch({ type: "TOGGLE_FIXED_CODE_STATUS", payload: status });
  }, []);

  const setAllFixedCodeStatuses = useCallback((visible: boolean) => {
    dispatch({ type: "SET_ALL_FIXED_CODE_STATUSES", payload: visible });
  }, []);

  const toggleBasemap = useCallback(() => {
    dispatch({ type: "TOGGLE_BASEMAP" });
  }, []);

  const setBasemapVisible = useCallback((visible: boolean) => {
    dispatch({ type: "SET_BASEMAP_VISIBLE", payload: visible });
  }, []);

  const setActiveTab = useCallback((tab: ViewSegmentOption) => {
    dispatch({ type: "SET_ACTIVE_TAB", payload: tab });
  }, []);

  const setMobileSubHeaderTab = useCallback((tab: MobileSubHeaderTab) => {
    dispatch({ type: "SET_MOBILE_SUBHEADER_TAB", payload: tab });
  }, []);

  const setMobileSearchFilter = useCallback((filter: MobileSearchFilterType) => {
    dispatch({ type: "SET_MOBILE_SEARCH_FILTER", payload: filter });
  }, []);

  const setLayerLoadStatus = useCallback(
    (
      kind: LayerKind,
      loadStatus: MapLayerLoadStatus,
      featureCount: number,
      minZoom: number | null,
      activeDataVersionId: string | null,
      error?: string | null
    ) => {
      dispatch({
        type: "SET_LAYER_LOAD_STATUS",
        payload: {
          kind,
          loadStatus,
          featureCount,
          minZoom,
          activeDataVersionId,
          error,
        },
      });
    },
    []
  );

  const setInitialLoading = useCallback((loading: boolean) => {
    dispatch({ type: "SET_INITIAL_LOADING", payload: loading });
  }, []);

  const setMacroLayers = useCallback(
    (
      featuresByKind: Partial<Record<"MANZANAS" | "VIAS", MapGeoJsonFeatureCollection>>,
      metadataByKind: Partial<Record<"MANZANAS" | "VIAS", MapLayerFeatures>>
    ) => {
      dispatch({
        type: "SET_MACRO_LAYERS",
        payload: { featuresByKind, metadataByKind },
      });
    },
    []
  );

  const setMacroLayersLoading = useCallback((loading: boolean) => {
    dispatch({ type: "SET_MACRO_LAYERS_LOADING", payload: loading });
  }, []);

  const contextValue = useMemo(
    () => ({
      state,
      setViewport,
      toggleLayer,
      setLayerVisibility,
      toggleFixedCodeStatus,
      setAllFixedCodeStatuses,
      toggleBasemap,
      setBasemapVisible,
      setActiveTab,
      setMobileSubHeaderTab,
      setMobileSearchFilter,
      setLayerLoadStatus,
      setInitialLoading,
      setMacroLayers,
      setMacroLayersLoading,
      registerZoomHandlers,
      zoomIn,
      zoomOut,
    }),
    [
      state,
      setViewport,
      toggleLayer,
      setLayerVisibility,
      toggleFixedCodeStatus,
      setAllFixedCodeStatuses,
      toggleBasemap,
      setBasemapVisible,
      setActiveTab,
      setMobileSubHeaderTab,
      setMobileSearchFilter,
      setLayerLoadStatus,
      setInitialLoading,
      setMacroLayers,
      setMacroLayersLoading,
      registerZoomHandlers,
      zoomIn,
      zoomOut,
    ]
  );

  return (
    <MapViewContext.Provider value={contextValue}>
      {children}
    </MapViewContext.Provider>
  );
}

export function useMapView(): MapViewContextType {
  const context = useContext(MapViewContext);
  if (!context) {
    throw new Error("useMapView debe ser utilizado dentro de un MapViewProvider");
  }
  return context;
}
