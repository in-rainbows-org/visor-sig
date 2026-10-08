// Capas cartográficas de consulta disponibles
export type ConsultationLayerKind = "codigos-fijos" | "lotes" | "manzanas" | "vias";

// Entidad de consulta para Manzanas
export type ManzanaConsultation = {
  id: string;
  uvBlockCode: string | null;
  uv: string | null;
  blockNumber: string | null;
};

// Entidad de consulta para Vías
export type ViaConsultation = {
  id: string;
  name: string | null;
  reference: string | null;
  roadType: string | null;
};

// Entidad de consulta para Lotes
export type LoteConsultation = {
  id: string;
  lotNumber: string | null;
  manzanaUvBlockCode: string | null;
};

// Entidad de consulta para Códigos Fijos
export type CodigoFijoConsultation = {
  id: string;
  label: string | null;
  fixedCode: number | null;
  name: string | null;
  status: number;
  lotNumber: string | null;
};

// Entidad de detalle georreferenciado para Códigos Fijos
export type CodigoFijoDetail = {
  id: string;
  label: string | null;
  fixedCode: number | null;
  name: string | null;
  status: number;
  latitude: number;
  longitude: number;
  lotNumber: string | null;
  uv: string | null;
  blockNumber: string | null;
  uvBlockCode: string | null;
};


// Unión discriminada de registros
export type AnyConsultationItem =
  | ({ layer: "codigos-fijos" } & CodigoFijoConsultation)
  | ({ layer: "lotes" } & LoteConsultation)
  | ({ layer: "manzanas" } & ManzanaConsultation)
  | ({ layer: "vias" } & ViaConsultation);

// Paginación genérica de dominio
export type PaginatedConsultationResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};
