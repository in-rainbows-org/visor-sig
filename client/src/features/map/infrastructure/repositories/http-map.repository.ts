import { API_BASE_URL } from "@/features/shared/config/api.config";
import type { ApiResult } from "@/features/shared/domain/types/api-results";
import { apiRequestData } from "@/features/shared/infrastructure/http/api-client";
import type { FixedCodeStatusValue } from "../../domain/models/fixed-code-status.types";
import type {
  LayerKind,
  MapFeaturesResponse,
  MapViewport,
} from "../../domain/models/map.types";
import { mapMapper } from "../mappers/map.mapper";
import { mapFeaturesResponseSchema } from "../schemas/map.schemas";

export type GetActiveMapFeaturesParams = {
  layerKinds: LayerKind[];
  viewport: MapViewport;
  fixedCodeStatuses?: FixedCodeStatusValue[];
  signal?: AbortSignal;
};

export class HttpMapRepository {
  async getActiveMapFeatures({
    layerKinds,
    viewport,
    fixedCodeStatuses,
    signal,
  }: GetActiveMapFeaturesParams): Promise<ApiResult<MapFeaturesResponse>> {
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
      responseSchema: mapFeaturesResponseSchema,
      fallbackMessage: "No se pudieron obtener las geometrías del visor.",
      signal,
      mapData: (dto) => mapMapper.toDomain(dto),
    });
  }
}

export const httpMapRepository = new HttpMapRepository();
export const httpGeographicMapRepository = httpMapRepository;
