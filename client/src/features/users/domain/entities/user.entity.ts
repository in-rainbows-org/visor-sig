import type { AppRole } from "@/lib/auth-roles";

export interface User {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: AppRole;
  banned: boolean;
  banReason: string | null;
  banExpires: Date | null;
  createdAt: Date;
  isCurrentUser: boolean;
}

export interface BanUserRequest {
  userId: string;
  banReason: string;
  banExpiresIn?: number | null; // Duración en segundos (null = permanente)
}

export interface UpdateRoleRequest {
  userId: string;
  role: AppRole;
}
