import { API_BASE_URL } from "@/features/shared/config/api.config";
import type { ApiResult } from "@/features/shared/domain/types/api-results";
import {
  apiRequestData,
  apiRequestFormData,
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

export class DataVersionRepositoryImpl implements DataVersionRepository {
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

export const dataVersionRepositoryImpl = new DataVersionRepositoryImpl();
