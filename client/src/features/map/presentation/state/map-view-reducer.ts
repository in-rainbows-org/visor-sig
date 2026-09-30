import type { FixedCodeStatusValue } from "../../domain/models/fixed-code-status.types";
import { ALL_FIXED_CODE_STATUS_VALUES } from "../../domain/models/fixed-code-status.types";
import type {
  LayerKind,
  MapLayerLoadStatus,
  MapViewport,
  MobileSearchFilterType,
  MobileSubHeaderTab,
  ViewSegmentOption,
} from "../../domain/models/map.types";
import {
  DEFAULT_MAP_ZOOM,
  DEFAULT_VISIBLE_LAYER_KINDS,
} from "../../domain/models/map.types";

export type LayerLoadState = {
  loadStatus: MapLayerLoadStatus;
  featureCount: number;
  minZoom: number | null;
  activeDataVersionId: string | null;
  error?: string | null;
};

export type MapViewState = {
  viewport: MapViewport;
  visibleLayerKinds: Set<LayerKind>;
  visibleFixedCodeStatuses: Set<FixedCodeStatusValue>;
  isBasemapVisible: boolean;
  activeTab: ViewSegmentOption;
  mobileSubHeaderTab: MobileSubHeaderTab;
  mobileSearchFilter: MobileSearchFilterType;
  layerLoads: Record<LayerKind, LayerLoadState>;
  isLoadingInitial: boolean;
};

export type MapViewAction =
  | { type: "SET_VIEWPORT"; payload: MapViewport }
  | { type: "TOGGLE_LAYER"; payload: LayerKind }
  | { type: "SET_LAYER_VISIBILITY"; payload: { kind: LayerKind; visible: boolean } }
  | { type: "TOGGLE_FIXED_CODE_STATUS"; payload: FixedCodeStatusValue }
  | { type: "SET_ALL_FIXED_CODE_STATUSES"; payload: boolean }
  | { type: "TOGGLE_BASEMAP" }
  | { type: "SET_BASEMAP_VISIBLE"; payload: boolean }
  | { type: "SET_ACTIVE_TAB"; payload: ViewSegmentOption }
  | { type: "SET_MOBILE_SUBHEADER_TAB"; payload: MobileSubHeaderTab }
  | { type: "SET_MOBILE_SEARCH_FILTER"; payload: MobileSearchFilterType }
  | {
      type: "SET_LAYER_LOAD_STATUS";
      payload: {
        kind: LayerKind;
        loadStatus: MapLayerLoadStatus;
        featureCount: number;
        minZoom: number | null;
        activeDataVersionId: string | null;
        error?: string | null;
      };
    }
  | { type: "SET_INITIAL_LOADING"; payload: boolean };

export const initialMapViewState: MapViewState = {
  viewport: {
    west: -61.02,
    south: -16.45,
    east: -60.90,
    north: -16.33,
    zoom: DEFAULT_MAP_ZOOM,
  },
  visibleLayerKinds: new Set<LayerKind>(DEFAULT_VISIBLE_LAYER_KINDS),
  visibleFixedCodeStatuses: new Set<FixedCodeStatusValue>(ALL_FIXED_CODE_STATUS_VALUES),
  isBasemapVisible: true,
  activeTab: "layers",
  mobileSubHeaderTab: null,
  mobileSearchFilter: "codigo",
  layerLoads: {
    CODIGOS_FIJOS: { loadStatus: "READY", featureCount: 0, minZoom: 13, activeDataVersionId: null },
    LOTES: { loadStatus: "READY", featureCount: 0, minZoom: 15, activeDataVersionId: null },
    MANZANAS: { loadStatus: "READY", featureCount: 0, minZoom: null, activeDataVersionId: null },
    VIAS: { loadStatus: "READY", featureCount: 0, minZoom: null, activeDataVersionId: null },
  },
  isLoadingInitial: true,
};

export function mapViewReducer(state: MapViewState, action: MapViewAction): MapViewState {
  switch (action.type) {
    case "SET_VIEWPORT": {
      const p = action.payload;
      const v = state.viewport;
      if (
        v.zoom === p.zoom &&
        Math.abs(v.west - p.west) < 1e-6 &&
        Math.abs(v.south - p.south) < 1e-6 &&
        Math.abs(v.east - p.east) < 1e-6 &&
        Math.abs(v.north - p.north) < 1e-6
      ) {
        return state;
      }
      return {
        ...state,
        viewport: action.payload,
      };
    }

    case "TOGGLE_LAYER": {
      const next = new Set(state.visibleLayerKinds);
      if (next.has(action.payload)) {
        next.delete(action.payload);
      } else {
        next.add(action.payload);
      }
      return {
        ...state,
        visibleLayerKinds: next,
      };
    }

    case "SET_LAYER_VISIBILITY": {
      const hasKind = state.visibleLayerKinds.has(action.payload.kind);
      if (hasKind === action.payload.visible) {
        return state;
      }
      const next = new Set(state.visibleLayerKinds);
      if (action.payload.visible) {
        next.add(action.payload.kind);
      } else {
        next.delete(action.payload.kind);
      }
      return {
        ...state,
        visibleLayerKinds: next,
      };
    }

    case "TOGGLE_FIXED_CODE_STATUS": {
      const next = new Set(state.visibleFixedCodeStatuses);
      if (next.has(action.payload)) {
        next.delete(action.payload);
      } else {
        next.add(action.payload);
      }
      return {
        ...state,
        visibleFixedCodeStatuses: next,
      };
    }

    case "SET_ALL_FIXED_CODE_STATUSES": {
      const next = action.payload
        ? new Set<FixedCodeStatusValue>(ALL_FIXED_CODE_STATUS_VALUES)
        : new Set<FixedCodeStatusValue>();
      return {
        ...state,
        visibleFixedCodeStatuses: next,
      };
    }

    case "TOGGLE_BASEMAP":
      return {
        ...state,
        isBasemapVisible: !state.isBasemapVisible,
      };

    case "SET_BASEMAP_VISIBLE":
      if (state.isBasemapVisible === action.payload) return state;
      return {
        ...state,
        isBasemapVisible: action.payload,
      };

    case "SET_ACTIVE_TAB":
      if (state.activeTab === action.payload) return state;
      return {
        ...state,
        activeTab: action.payload,
      };

    case "SET_MOBILE_SUBHEADER_TAB":
      if (state.mobileSubHeaderTab === action.payload) return state;
      return {
        ...state,
        mobileSubHeaderTab: action.payload,
      };

    case "SET_MOBILE_SEARCH_FILTER":
      if (state.mobileSearchFilter === action.payload) return state;
      return {
        ...state,
        mobileSearchFilter: action.payload,
      };

    case "SET_LAYER_LOAD_STATUS": {
      const { kind, ...loadState } = action.payload;
      const current = state.layerLoads[kind];
      if (
        current &&
        current.loadStatus === loadState.loadStatus &&
        current.featureCount === loadState.featureCount &&
        current.minZoom === loadState.minZoom &&
        current.activeDataVersionId === loadState.activeDataVersionId &&
        (current.error ?? null) === (loadState.error ?? null)
      ) {
        return state;
      }
      return {
        ...state,
        layerLoads: {
          ...state.layerLoads,
          [kind]: loadState,
        },
      };
    }

    case "SET_INITIAL_LOADING":
      if (state.isLoadingInitial === action.payload) return state;
      return {
        ...state,
        isLoadingInitial: action.payload,
      };

    default:
      return state;
  }
}
