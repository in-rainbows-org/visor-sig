import { z } from "zod";

/**
 * Esquema de validación para una parada individual devuelta por el backend en snake_case
 */
export const assignmentStopDetailReadSchema = z.object({
  id: z.string().uuid(),
  codigo_fijo_id: z.string().uuid(),
  fixed_code: z.number().nullable().optional(),
  name: z.string().nullable().optional(),
  latitude: z.number(),
  longitude: z.number(),
  order_index: z.number().int().positive(),
  status: z.enum(["PENDING", "IN_TRANSIT", "ARRIVED", "COMPLETED", "FAILED"]),
  in_transit_at: z.string().datetime({ offset: true }).nullable().optional(),
  arrived_at: z.string().datetime({ offset: true }).nullable().optional(),
  completed_at: z.string().datetime({ offset: true }).nullable().optional(),
  route_geometry: z.record(z.string(), z.unknown()).default({}),
});

/**
 * Esquema de validación para el detalle completo de la asignación devuelta por el backend en snake_case
 */
export const assignmentDetailReadSchema = z.object({
  id: z.string().uuid(),
  technician_name: z.string().nullable().optional(),
  technician_image: z.string().nullable().optional(),
  scheduled_date: z.string(),
  started_at: z.string().datetime({ offset: true }).nullable().optional(),
  completed_at: z.string().datetime({ offset: true }).nullable().optional(),
  status: z.enum(["ASSIGNED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]),
  assignment_type: z.enum(["CUT", "RECONNECTION"]),
  total_stops: z.number().int().nonnegative(),
  total_distance_km: z.number().nonnegative(),
  start_latitude: z.number(),
  start_longitude: z.number(),
  completed_stops: z.number().int().nonnegative(),
  stops: z.array(assignmentStopDetailReadSchema),
});

export type AssignmentStopDetailReadDTO = z.infer<typeof assignmentStopDetailReadSchema>;
export type AssignmentDetailReadDTO = z.infer<typeof assignmentDetailReadSchema>;
