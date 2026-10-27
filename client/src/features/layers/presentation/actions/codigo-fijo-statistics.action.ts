"use server";

import type { ApiResult } from "@/features/shared/domain/types/api-results";
import type { CodigoFijoStatistics } from "@/features/layers/domain/entities/codigo-fijo-statistics.entity";
import { getCodigoFijoStatisticsQuery } from "@/features/layers/presentation/queries/codigo-fijo-statistics.query";

/**
 * Server Action invocable desde el cliente para refrescar las estadísticas cuantitativas
 * de códigos fijos sin recarga completa de página.
 */
export async function getCodigoFijoStatisticsAction(): Promise<ApiResult<CodigoFijoStatistics>> {
  return getCodigoFijoStatisticsQuery();
}
