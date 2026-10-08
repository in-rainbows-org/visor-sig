import type { ApiResult } from "@/features/shared/domain/types/api-results";
import type { FixedCodeStatusValue } from "../entities/fixed-code-status.entity";
import type {
  LayerKind,
  MapFeatures,
  MapMacroLayers,
  MapViewport,
} from "../entities/map.entity";

export type GetActiveMapFeaturesFilters = {
  layerKinds: LayerKind[];
  viewport: MapViewport;
  fixedCodeStatuses?: FixedCodeStatusValue[];
  signal?: AbortSignal;
};

export interface MapRepository {
  getActiveMapFeatures(filters: GetActiveMapFeaturesFilters): Promise<ApiResult<MapFeatures>>;
  getActiveMacroLayers(signal?: AbortSignal): Promise<ApiResult<MapMacroLayers>>;
}
