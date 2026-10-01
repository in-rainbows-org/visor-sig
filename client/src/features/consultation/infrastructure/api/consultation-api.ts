import { z } from "zod";
import { API_BASE_URL } from "@/features/shared/config/api.config";
import { apiRequestData } from "@/features/shared/infrastructure/http/api-client";
import { ApiResult } from "@/features/shared/domain/types/api-results";
import {
  ConsultationFilter,
  LayerOption,
  PaginatedConsultationResponse,
} from "../../domain/models/consultation";

const fieldSchema = z.object({
  key: z.string(),
  label: z.string(),
  type: z.string().default("string"),
});

const layerMetadataSchema = z.object({
  id: z.string(),
  kind: z.string(),
  name: z.string(),
  geometry_type: z.string(),
  color: z.string(),
  has_active_version: z.boolean(),
  fields: z.array(fieldSchema).default([]),
});

const layersResponseSchema = z.array(layerMetadataSchema);

const recordSchema = z.object({
  id: z.string(),
  layer_kind: z.string(),
  code: z.string(),
  manzana: z.string().nullable().optional(),
  surface: z.string().nullable().optional(),
  status: z.string().default("Registrado"),
  status_color: z.string().default("emerald"),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  attributes: z.record(z.string(), z.unknown()).default({}),
});

const searchResponseSchema = z.object({
  items: z.array(recordSchema).default([]),
  total: z.number(),
  page: z.number(),
  page_size: z.number(),
  total_pages: z.number(),
  layer_name: z.string(),
});

export async function fetchConsultationLayers(): Promise<ApiResult<LayerOption[]>> {
  return apiRequestData({
    url: `${API_BASE_URL}/api/consultations/layers`,
    method: "GET",
    fallbackMessage: "Error al cargar las capas disponibles",
    responseSchema: layersResponseSchema,
    mapData: (data) =>
      data.map((l) => ({
        id: l.id,
        kind: l.kind,
        name: l.name,
        geometryType: l.geometry_type,
        color: l.color,
        hasActiveVersion: l.has_active_version,
        fields: l.fields.map((f) => ({
          key: f.key,
          label: f.label,
          type: f.type,
        })),
      })),
  });
}

export async function searchConsultationEntities(
  filter: ConsultationFilter
): Promise<ApiResult<PaginatedConsultationResponse>> {
  const queryParams = new URLSearchParams();
  queryParams.set("layer_kind", filter.layerKind);
  if (filter.field) queryParams.set("field", filter.field);
  if (filter.value !== undefined && filter.value !== null) {
    queryParams.set("value", filter.value);
  }
  queryParams.set("page", String(filter.page ?? 1));
  queryParams.set("page_size", String(filter.pageSize ?? 10));

  return apiRequestData({
    url: `${API_BASE_URL}/api/consultations/search?${queryParams.toString()}`,
    method: "GET",
    fallbackMessage: "Error al ejecutar la consulta",
    responseSchema: searchResponseSchema,
    mapData: (data) => ({
      items: data.items.map((item) => ({
        id: item.id,
        layerKind: item.layer_kind,
        code: item.code,
        manzana: item.manzana,
        surface: item.surface,
        status: item.status,
        statusColor: item.status_color,
        latitude: item.latitude,
        longitude: item.longitude,
        attributes: item.attributes,
      })),
      total: data.total,
      page: data.page,
      pageSize: data.page_size,
      totalPages: data.total_pages,
      layerName: data.layer_name,
    }),
  });
}
