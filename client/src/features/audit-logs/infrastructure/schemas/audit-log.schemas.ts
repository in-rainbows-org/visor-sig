import { z } from "zod";

export const AuditLogItemResponseSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string(),
  user_name: z.string().nullable().optional(),
  user_image: z.string().nullable().optional(),
  user_email: z.string().nullable().optional(),
  action: z.enum(["LOGIN", "LOGOUT", "SEARCH", "CREATE", "UPDATE", "DELETE"]),
  description: z.string(),
  created_date: z.string(),
});

export type AuditLogItemResponseDTO = z.infer<typeof AuditLogItemResponseSchema>;

export const PaginatedAuditLogsResponseSchema = z.object({
  items: z.array(AuditLogItemResponseSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  page_size: z.number().int().positive(),
  total_pages: z.number().int().nonnegative(),
});

export type PaginatedAuditLogsResponseDTO = z.infer<
  typeof PaginatedAuditLogsResponseSchema
>;
