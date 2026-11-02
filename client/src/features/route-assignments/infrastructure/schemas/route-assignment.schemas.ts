import { z } from "zod";

/**
 * Esquema de lectura para un técnico u operario
 */
export const technicianOptionReadSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().nullable().optional(),
  image: z.string().nullable().optional(),
});

export const techniciansListReadSchema = z.array(technicianOptionReadSchema);

/**
 * Esquema de lectura para una asignación individual en el historial
 */
export const assignmentSummaryReadSchema = z.object({
  id: z.string(),
  technician_id: z.string(),
  technician_name: z.string().nullable().optional(),
  technician_image: z.string().nullable().optional(),
  technician_email: z.string().nullable().optional(),
  total_stops: z.number().int().nonnegative(),
  scheduled_date: z.string(),
  assignment_type: z.enum(["CUT", "RECONNECTION"]),
  status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"]),
  created_date: z.string(),
});

/**
 * Esquema de lectura para el resultado paginado de asignaciones
 */
export const paginatedAssignmentsReadSchema = z.object({
  items: z.array(assignmentSummaryReadSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  page_size: z.number().int().positive(),
  total_pages: z.number().int().nonnegative(),
});

/**
 * Esquema de lectura para una parada optimizada devuelta por el servicio de ruteo
 */
export const optimizedStopReadSchema = z.object({
  codigo_fijo_id: z.string(),
  order_index: z.number().int().positive(),
  latitude: z.number(),
  longitude: z.number(),
  leg_distance_km: z.number(),
  leg_duration_seconds: z.number(),
  leg_geometry: z.any().nullable().optional(),
});

/**
 * Esquema de lectura para el cálculo completo de la ruta
 */
export const calculateRouteReadSchema = z.object({
  total_distance_km: z.number(),
  total_duration_seconds: z.number(),
  encoded_polyline: z.string().nullable().optional(),
  ordered_stops: z.array(optimizedStopReadSchema),
});

/**
 * Esquema de lectura para la asignación creada
 */
export const createdAssignmentReadSchema = z.object({
  id: z.string(),
  technician_id: z.string(),
  status: z.string(),
  scheduled_date: z.string(),
});

export type TechnicianOptionReadDTO = z.infer<typeof technicianOptionReadSchema>;
export type AssignmentSummaryReadDTO = z.infer<typeof assignmentSummaryReadSchema>;
export type PaginatedAssignmentsReadDTO = z.infer<typeof paginatedAssignmentsReadSchema>;
export type CalculateRouteReadDTO = z.infer<typeof calculateRouteReadSchema>;
export type CreatedAssignmentReadDTO = z.infer<typeof createdAssignmentReadSchema>;
