import type { ApiResult } from "@/features/shared/domain/types/api-results";
import type { RouteTechnicianOption } from "../../domain/entities/route-technician.entity";
import { routeAssignmentRepository } from "../repositories/route-assignment.repository-impl";

const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutos de validez en memoria

/**
 * Servicio singleton de caché en memoria para el catálogo de técnicos operativos.
 * Permite hidratar de manera inmediata el formulario de nueva asignación (Paso 2)
 * reutilizando los técnicos consultados previamente en el historial de asignaciones,
 * evitando llamadas redundantes de red y deduplicando peticiones en vuelo.
 */
class TechniciansCacheService {
  private cachedData: RouteTechnicianOption[] | null = null;
  private cachedAt: number | null = null;
  private inFlightRequest: Promise<ApiResult<RouteTechnicianOption[]>> | null = null;
  private ttlMs: number = DEFAULT_TTL_MS;

  /**
   * Obtiene los técnicos desde caché si están disponibles y vigentes,
   * o bien realiza la consulta al backend deduplicando peticiones simultáneas.
   */
  async getTechnicians(options?: { forceRefresh?: boolean }): Promise<ApiResult<RouteTechnicianOption[]>> {
    const isExpired = this.cachedAt === null || Date.now() - this.cachedAt > this.ttlMs;

    if (!options?.forceRefresh && this.cachedData !== null && !isExpired) {
      return {
        ok: true,
        data: this.cachedData,
      };
    }

    if (this.inFlightRequest) {
      return this.inFlightRequest;
    }

    this.inFlightRequest = (async () => {
      try {
        const result = await routeAssignmentRepository.getTechnicians();
        if (result.ok) {
          this.cachedData = result.data;
          this.cachedAt = Date.now();
        }
        return result;
      } finally {
        this.inFlightRequest = null;
      }
    })();

    return this.inFlightRequest;
  }

  /**
   * Retorna de manera síncrona los técnicos en caché si existen y están vigentes.
   * Útil para renderizado inicial sin parpadeos en componentes de React.
   */
  getCachedTechnicians(): RouteTechnicianOption[] | null {
    if (this.cachedData === null || this.cachedAt === null) {
      return null;
    }
    const isExpired = Date.now() - this.cachedAt > this.ttlMs;
    if (isExpired) {
      return null;
    }
    return this.cachedData;
  }

  /**
   * Almacena manualmente un listado de técnicos en caché.
   */
  setCachedTechnicians(data: RouteTechnicianOption[]): void {
    this.cachedData = data;
    this.cachedAt = Date.now();
  }

  /**
   * Invalida la caché obligando a una nueva consulta en la próxima solicitud.
   */
  invalidateCache(): void {
    this.cachedData = null;
    this.cachedAt = null;
    this.inFlightRequest = null;
  }
}

export const techniciansCache = new TechniciansCacheService();
