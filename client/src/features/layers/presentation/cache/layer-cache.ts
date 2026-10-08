import type { Layer } from "../../domain/entities/layer.entity";
import type { DataVersion } from "../../domain/entities/data-version.entity";

/**
 * Gestor de caché en memoria del cliente para capas y versiones de capas.
 * Permite la persistencia de las versiones consultadas de cada capa durante
 * la sesión activa del usuario, logrando que al cerrar y reabrir el historial
 * de cualquier capa se cargue instantáneamente sin llamadas redundantes al backend.
 */
class LayerCacheManager {
  /**
   * Mapa de versiones cacheadas por ID de capa.
   * Clave: layerId (string) -> Valor: DataVersion[]
   */
  private readonly versionCache = new Map<string, DataVersion[]>();

  /**
   * Catálogo de capas del Dashboard cacheado en memoria del cliente.
   */
  private layersCache: Layer[] | null = null;

  // ── Capas del Catálogo (Dashboard) ──────────────────────────────────────────

  getLayers(): Layer[] | null {
    return this.layersCache;
  }

  setLayers(layers: Layer[]): void {
    this.layersCache = layers;
  }

  hasLayers(): boolean {
    return this.layersCache !== null && this.layersCache.length > 0;
  }

  invalidateLayers(): void {
    this.layersCache = null;
  }

  // ── Historial de Versiones por Capa ─────────────────────────────────────────

  getVersions(layerId: string): DataVersion[] | undefined {
    return this.versionCache.get(layerId);
  }

  setVersions(layerId: string, versions: DataVersion[]): void {
    this.versionCache.set(layerId, versions);
  }

  hasVersions(layerId: string): boolean {
    return this.versionCache.has(layerId);
  }

  invalidateVersions(layerId?: string): void {
    if (layerId) {
      this.versionCache.delete(layerId);
    } else {
      this.versionCache.clear();
    }
  }

  // ── Limpieza Total ─────────────────────────────────────────────────────────

  invalidateAll(): void {
    this.invalidateLayers();
    this.invalidateVersions();
  }
}

export const layerCache = new LayerCacheManager();
