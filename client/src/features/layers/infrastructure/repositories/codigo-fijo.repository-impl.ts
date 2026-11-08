import { API_BASE_URL } from "@/features/shared/config/api.config";
import type { ApiResult } from "@/features/shared/domain/types/api-results";
import { apiRequestData } from "@/features/shared/infrastructure/http/api-client";
import type {
  CodigoFijo,
  CreateCodigoFijoInput,
} from "../../domain/entities/codigo-fijo.entity";
import type { CodigoFijoRepository } from "../../domain/repositories/codigo-fijo.repository";
import { codigoFijoMapper } from "../mappers/codigo-fijo.mapper";
import { codigoFijoReadSchema } from "../schemas/codigo-fijo.schemas";

export class CodigoFijoRepositoryImpl implements CodigoFijoRepository {
  private readonly baseUrl = `${API_BASE_URL}/api/layers/codigos-fijos`;

  async create(input: CreateCodigoFijoInput): Promise<ApiResult<CodigoFijo>> {
    return apiRequestData({
      url: this.baseUrl,
      method: "POST",
      body: codigoFijoMapper.toCreatePayload(input),
      responseSchema: codigoFijoReadSchema,
      fallbackMessage: "No se pudo registrar el código fijo.",
      mapData: codigoFijoMapper.toDomain,
    });
  }
}

export const codigoFijoRepositoryImpl = new CodigoFijoRepositoryImpl();
