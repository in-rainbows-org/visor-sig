import { z } from "zod";

export const technicianAssignmentReadSchema = z.object({
  id: z.string().uuid(),
  assignment_type: z.enum(["CUT", "RECONNECTION"]),
  status: z.enum(["PENDING", "ASSIGNED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]),
  scheduled_date: z.string(),
  total_stops: z.number().int().nonnegative(),
  total_distance_km: z.number().nonnegative(),
  started_at: z.string().nullable().optional(),
  completed_at: z.string().nullable().optional(),
  created_date: z.string(),
});

export const technicianAssignmentsListReadSchema = z.array(technicianAssignmentReadSchema);

export type TechnicianAssignmentReadDTO = z.infer<typeof technicianAssignmentReadSchema>;
