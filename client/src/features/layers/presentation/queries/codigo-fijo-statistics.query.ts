import "server-only";
import { API_BASE_URL } from "@/features/shared/config/api.config";
import type { ApiResult } from "@/features/shared/domain/types/api-results";
import { apiRequestData } from "@/features/shared/infrastructure/http/api-client";
import type { CodigoFijoStatistics } from "@/features/layers/domain/entities/codigo-fijo-statistics.entity";
import { codigoFijoStatisticsMapper } from "@/features/layers/infrastructure/mappers/codigo-fijo-statistics.mapper";
import { codigoFijoStatisticsReadSchema } from "@/features/layers/infrastructure/schemas/codigo-fijo-statistics.schema";

/**
 * Consulta de servidor para recuperar el resumen cuantitativo de códigos fijos.
 */
export async function getCodigoFijoStatisticsQuery(): Promise<ApiResult<CodigoFijoStatistics>> {
  return apiRequestData({
    url: `${API_BASE_URL}/api/layers/codigos-fijos/statistics`,
    method: "GET",
    responseSchema: codigoFijoStatisticsReadSchema,
    fallbackMessage: "No se pudieron obtener las estadísticas de códigos fijos.",
    mapData: codigoFijoStatisticsMapper.toDomain,
  });
}
