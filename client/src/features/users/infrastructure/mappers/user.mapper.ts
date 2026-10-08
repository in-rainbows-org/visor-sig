import { APP_ROLES, type AppRole } from "@/lib/auth-roles";
import type { User } from "../../domain/entities/user.entity";
import type { BetterAuthUserDto } from "../schemas/user.schemas";

export const userMapper = {
  toDomain(dto: BetterAuthUserDto, currentUserId?: string): User {
    const isCurrentUser = Boolean(currentUserId && dto.id === currentUserId);
    const role: AppRole =
      dto.role === APP_ROLES.ADMIN ? APP_ROLES.ADMIN : APP_ROLES.CONSULTANT;

    let banExpires: Date | null = null;
    if (dto.banExpires) {
      banExpires = new Date(dto.banExpires);
    }

    return {
      id: dto.id,
      name: dto.name || "Sin nombre",
      email: dto.email,
      image: dto.image ?? null,
      role,
      banned: Boolean(dto.banned),
      banReason: dto.banReason ?? null,
      banExpires,
      createdAt: new Date(dto.createdAt),
      isCurrentUser,
    };
  },

  toDomainList(dtos: BetterAuthUserDto[], currentUserId?: string): User[] {
    const domainUsers = dtos.map((dto) => this.toDomain(dto, currentUserId));

    // Anclar al usuario logueado en la primera posición si existe
    return domainUsers.sort((a, b) => {
      if (a.isCurrentUser) return -1;
      if (b.isCurrentUser) return 1;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
  },
};
