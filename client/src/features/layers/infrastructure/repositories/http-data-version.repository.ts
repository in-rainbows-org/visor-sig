import { API_BASE_URL } from "@/features/shared/config/api.config";
import type {
  ApiMaybeResult,
  ApiResult,
} from "@/features/shared/domain/types/api-results";
import {
  apiRequestData,
  apiRequestFormData,
  apiRequestMaybeData,
} from "@/features/shared/infrastructure/http/api-client";
import type {
  ActivateDataVersionInput,
  DataVersion,
  ImportGeographicDataInput,
} from "../../domain/entities/data-version.entity";
import type { DataVersionRepository } from "../../domain/repositories/data-version.repository";
import { dataVersionMapper } from "../mappers/data-version.mapper";
import {
  dataVersionListReadSchema,
  dataVersionReadSchema,
} from "../schemas/data-version.schemas";

export class HttpDataVersionRepository implements DataVersionRepository {
  private getLayerVersionsUrl(layerId: string): string {
    return `${API_BASE_URL}/api/layers/${layerId}/data-versions`;
  }

  async listByLayer(layerId: string): Promise<ApiResult<DataVersion[]>> {
    return apiRequestData({
      url: this.getLayerVersionsUrl(layerId),
      method: "GET",
      responseSchema: dataVersionListReadSchema,
      fallbackMessage: "No se pudo obtener el historial de versiones de la capa.",
      mapData: (dto) => dataVersionMapper.toDomainList(dto.items),
    });
  }

  async getById(
    layerId: string,
    versionId: string
  ): Promise<ApiMaybeResult<DataVersion>> {
    return apiRequestMaybeData({
      url: `${this.getLayerVersionsUrl(layerId)}/${versionId}`,
      method: "GET",
      responseSchema: dataVersionReadSchema,
      fallbackMessage: "No se pudo obtener la información de la versión.",
      mapData: dataVersionMapper.toDomain,
    });
  }

  async importZip(
    input: ImportGeographicDataInput
  ): Promise<ApiResult<DataVersion>> {
    const formData = new FormData();
    formData.append("file", input.file);

    return apiRequestFormData({
      url: this.getLayerVersionsUrl(input.layerId),
      method: "POST",
      body: formData,
      responseSchema: dataVersionReadSchema,
      fallbackMessage: "No se pudo importar el archivo de datos geográficos.",
      mapData: dataVersionMapper.toDomain,
    });
  }

  async activateVersion(
    input: ActivateDataVersionInput
  ): Promise<ApiResult<DataVersion>> {
    return apiRequestData({
      url: `${this.getLayerVersionsUrl(input.layerId)}/${input.versionId}/activate`,
      method: "POST",
      responseSchema: dataVersionReadSchema,
      fallbackMessage: "No se pudo activar la versión seleccionada.",
      mapData: dataVersionMapper.toDomain,
    });
  }
}

export const httpDataVersionRepository = new HttpDataVersionRepository();
