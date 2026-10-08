import { API_BASE_URL } from "@/features/shared/config/api.config";
import type { ApiResult } from "@/features/shared/domain/types/api-results";
import { apiRequestData } from "@/features/shared/infrastructure/http/api-client";
import type {
  ChangeLayerColorInput,
  Layer,
} from "../../domain/entities/layer.entity";
import type { LayerRepository } from "../../domain/repositories/layer.repository";
import { layerMapper } from "../mappers/layer.mapper";
import {
  layerListReadSchema,
  layerReadSchema,
} from "../schemas/layer.schemas";

export class LayerRepositoryImpl implements LayerRepository {
  private readonly baseUrl = `${API_BASE_URL}/api/layers`;

  async list(): Promise<ApiResult<Layer[]>> {
    return apiRequestData({
      url: this.baseUrl,
      method: "GET",
      responseSchema: layerListReadSchema,
      fallbackMessage: "No se pudo obtener el catálogo de capas.",
      mapData: (dto) => layerMapper.toDomainList(dto.items),
    });
  }

  async changeColor(
    layerId: string,
    input: ChangeLayerColorInput
  ): Promise<ApiResult<Layer>> {
    return apiRequestData({
      url: `${this.baseUrl}/${layerId}/color`,
      method: "PATCH",
      body: layerMapper.toChangeColorPayload(input),
      responseSchema: layerReadSchema,
      fallbackMessage: "No se pudo cambiar el color de la capa.",
      mapData: layerMapper.toDomain,
    });
  }
}

export const layerRepositoryImpl = new LayerRepositoryImpl();
