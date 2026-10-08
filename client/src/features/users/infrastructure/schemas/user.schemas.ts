import { z } from "zod";

export const BetterAuthUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  image: z.string().nullable().optional(),
  role: z.string().optional().default("CONSULTANT"),
  banned: z.boolean().nullable().optional().default(false),
  banReason: z.string().nullable().optional(),
  banExpires: z.union([z.string(), z.number(), z.date()]).nullable().optional(),
  createdAt: z.union([z.string(), z.number(), z.date()]),
});

export type BetterAuthUserDto = z.infer<typeof BetterAuthUserSchema>;
