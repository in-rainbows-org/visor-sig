import "server-only";
import type { ApiResult } from "@/features/shared/domain/types/api-results";
import type { Layer } from "../../domain/entities/layer.entity";
import { layerRepositoryImpl } from "../../infrastructure/repositories/layer.repository-impl";

let _cachedLayersResult: {
  data: ApiResult<Layer[]>;
  timestamp: number;
} | null = null;

const CACHE_TTL_MS = 60 * 1000 * 10; // 10 minutos de caché en servidor

export async function listLayersQuery(
  forceRefresh: boolean = false
): Promise<ApiResult<Layer[]>> {
  const now = Date.now();
  if (
    !forceRefresh &&
    _cachedLayersResult &&
    now - _cachedLayersResult.timestamp < CACHE_TTL_MS &&
    _cachedLayersResult.data.ok
  ) {
    return _cachedLayersResult.data;
  }

  const result = await layerRepositoryImpl.list();
  if (result.ok) {
    _cachedLayersResult = {
      data: result,
      timestamp: now,
    };
  }
  return result;
}

export function invalidateServerLayersCache(): void {
  _cachedLayersResult = null;
}

