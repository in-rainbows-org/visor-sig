import type { DataVersion } from "../../domain/entities/data-version.entity";

/**
 * Cache en memoria por capa para el historial de versiones de datos geográficos.
 * Permite que al abrir las distintas capas (por ejemplo las 4 capas del catálogo),
 * la consulta al servidor se realice únicamente la primera vez y subsiguientes
 * aperturas sean instantáneas.
 * 
 * Se resetea naturalmente al refrescar la página (F5 / recarga del navegador)
 * o cuando se importa una nueva versión o activa un rollback.
 */
class DataVersionCacheService {
  private cache = new Map<string, DataVersion[]>();

  get(layerId: string): DataVersion[] | undefined {
    return this.cache.get(layerId);
  }

  set(layerId: string, versions: DataVersion[]): void {
    this.cache.set(layerId, versions);
  }

  has(layerId: string): boolean {
    return this.cache.has(layerId);
  }

  invalidate(layerId?: string): void {
    if (layerId) {
      this.cache.delete(layerId);
    } else {
      this.cache.clear();
    }
  }
}

export const dataVersionCache = new DataVersionCacheService();
