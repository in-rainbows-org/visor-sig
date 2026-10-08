import type { ApiResult } from "@/features/shared/domain/types/api-results";
import type {
  CodigoFijoConsultation,
  CodigoFijoDetail,
  LoteConsultation,
  ManzanaConsultation,
  PaginatedConsultationResult,
  ViaConsultation,
} from "../entities/consultation.entity";

// Filtros base de paginación
export type BaseConsultationFilters = {
  page?: number;
  pageSize?: number;
};

// Filtros específicos por capa
export type CodigoFijoFilters = BaseConsultationFilters & {
  fixedCode?: number;
  name?: string;
};

export type LoteFilters = BaseConsultationFilters & {
  lotNumber?: string;
};

export type ManzanaFilters = BaseConsultationFilters & {
  uvBlockCode?: string;
  uv?: string;
  blockNumber?: string;
};

export type ViaFilters = BaseConsultationFilters & {
  roadType?: string;
  name?: string;
};

// Contrato de repositorio sin prefijo 'I' según la Constitución de Arquitectura
export interface ConsultationRepository {
  getCodigosFijos(
    filters?: CodigoFijoFilters
  ): Promise<ApiResult<PaginatedConsultationResult<CodigoFijoConsultation>>>;

  getCodigoFijoById(
    id: string
  ): Promise<ApiResult<CodigoFijoDetail>>;

  getLotes(
    filters?: LoteFilters
  ): Promise<ApiResult<PaginatedConsultationResult<LoteConsultation>>>;

  getManzanas(
    filters?: ManzanaFilters
  ): Promise<ApiResult<PaginatedConsultationResult<ManzanaConsultation>>>;

  getVias(
    filters?: ViaFilters
  ): Promise<ApiResult<PaginatedConsultationResult<ViaConsultation>>>;
}
