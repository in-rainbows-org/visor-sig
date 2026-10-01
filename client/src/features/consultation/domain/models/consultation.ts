export interface FieldOption {
  key: string;
  label: string;
  type: string;
}

export interface LayerOption {
  id: string;
  kind: string;
  name: string;
  geometryType: string;
  color: string;
  hasActiveVersion: boolean;
  fields: FieldOption[];
}

export interface ConsultationFilter {
  layerKind: string;
  field?: string;
  value?: string;
  page?: number;
  pageSize?: number;
}

export interface ConsultationRecord {
  id: string;
  layerKind: string;
  code: string;
  manzana?: string | null;
  surface?: string | null;
  status: string;
  statusColor: string;
  latitude?: number | null;
  longitude?: number | null;
  attributes?: Record<string, unknown>;
}

export interface PaginatedConsultationResponse {
  items: ConsultationRecord[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  layerName: string;
}
