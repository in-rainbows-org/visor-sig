import { API_BASE_URL } from "@/features/shared/config/api.config";
import type { ApiResult } from "@/features/shared/domain/types/api-results";
import { apiRequestData } from "@/features/shared/infrastructure/http/api-client";
import type {
  GetActiveMapFeaturesFilters,
  MapRepository,
} from "../../domain/repositories/map.repository";
import type {
  MapFeatures,
  MapMacroLayers,
} from "../../domain/entities/map.entity";
import { mapMapper } from "../mappers/map.mapper";
import {
  MapFeaturesResponseSchema,
  MapMacroLayersResponseSchema,
} from "../schemas/map.schemas";

export const mapRepositoryImpl: MapRepository = {
  async getActiveMapFeatures({
    layerKinds,
    viewport,
    fixedCodeStatuses,
    signal,
  }: GetActiveMapFeaturesFilters): Promise<ApiResult<MapFeatures>> {
    const params = new URLSearchParams();

    layerKinds.forEach((k) => params.append("layer_kinds", k));

    const bboxStr = `${viewport.west},${viewport.south},${viewport.east},${viewport.north}`;
    params.set("bbox", bboxStr);
    params.set("zoom", viewport.zoom.toString());

    if (layerKinds.includes("CODIGOS_FIJOS") && fixedCodeStatuses && fixedCodeStatuses.length > 0) {
      fixedCodeStatuses.forEach((s) => params.append("fixed_code_statuses", s.toString()));
    }

    const url = `${API_BASE_URL}/api/map/features?${params.toString()}`;

    return apiRequestData({
      url,
      method: "GET",
      responseSchema: MapFeaturesResponseSchema,
      fallbackMessage: "No se pudieron obtener las geometrías del visor.",
      signal,
      mapData: (dto) => mapMapper.toFeatures(dto),
    });
  },

  async getActiveMacroLayers(signal?: AbortSignal): Promise<ApiResult<MapMacroLayers>> {
    const url = `${API_BASE_URL}/api/map/macro-layers`;

    return apiRequestData({
      url,
      method: "GET",
      responseSchema: MapMacroLayersResponseSchema,
      fallbackMessage: "No se pudieron obtener las capas macro del visor.",
      signal,
      mapData: (dto) => mapMapper.toMacroLayers(dto),
    });
  },
};

export { mapRepositoryImpl as MapRepositoryImpl };
