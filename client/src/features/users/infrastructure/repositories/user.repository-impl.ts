import { authClient } from "@/lib/auth-client";
import type { ApiResult, ApiActionResult } from "@/features/shared/domain/types/api-results";
import type { User, BanUserRequest, UpdateRoleRequest } from "../../domain/entities/user.entity";
import type { UserRepository } from "../../domain/repositories/user.repository";
import { userMapper } from "../mappers/user.mapper";
import { BetterAuthUserSchema, type BetterAuthUserDto } from "../schemas/user.schemas";

export class UserRepositoryImpl implements UserRepository {
  async getUsers(currentUserId?: string): Promise<ApiResult<User[]>> {
    try {
      const response = await authClient.admin.listUsers({
        query: {
          limit: 100,
        },
      });

      if (response.error) {
        return {
          ok: false,
          statusCode: response.error.status || 500,
          errors: [response.error.message || "Error al listar los usuarios del sistema"],
        };
      }

      const rawUsers = response.data?.users ?? [];
      const parsedDtos: BetterAuthUserDto[] = [];

      for (const item of rawUsers) {
        const parseResult = BetterAuthUserSchema.safeParse(item);
        if (parseResult.success) {
          parsedDtos.push(parseResult.data);
        } else {
          // Fallback con datos crudos si alguna propiedad difiere
          parsedDtos.push({
            id: String(item.id),
            name: String(item.name ?? "Sin nombre"),
            email: String(item.email),
            image: item.image ? String(item.image) : null,
            role: item.role ? String(item.role) : "CONSULTANT",
            banned: Boolean(item.banned),
            banReason: item.banReason ? String(item.banReason) : null,
            banExpires: item.banExpires ?? null,
            createdAt: item.createdAt ?? new Date(),
          });
        }
      }

      const domainUsers = userMapper.toDomainList(parsedDtos, currentUserId);
      return {
        ok: true,
        data: domainUsers,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error inesperado al obtener usuarios";
      return {
        ok: false,
        statusCode: 500,
        errors: [message],
      };
    }
  }

  async updateRole(request: UpdateRoleRequest): Promise<ApiActionResult> {
    try {
      // Cast explícito necesario por la definición de tipos por defecto de better-auth client
      const response = await authClient.admin.setRole({
        userId: request.userId,
        role: request.role as unknown as "user" | "admin",
      });

      if (response.error) {
        return {
          ok: false,
          statusCode: response.error.status || 500,
          errors: [response.error.message || "Error al actualizar el rol del usuario"],
        };
      }

      return { ok: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error inesperado al actualizar rol";
      return {
        ok: false,
        statusCode: 500,
        errors: [message],
      };
    }
  }

  async banUser(request: BanUserRequest): Promise<ApiActionResult> {
    try {
      const response = await authClient.admin.banUser({
        userId: request.userId,
        banReason: request.banReason,
        banExpiresIn: request.banExpiresIn ? request.banExpiresIn : undefined,
      });

      if (response.error) {
        return {
          ok: false,
          statusCode: response.error.status || 500,
          errors: [response.error.message || "Error al bloquear al usuario"],
        };
      }

      return { ok: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error inesperado al bloquear usuario";
      return {
        ok: false,
        statusCode: 500,
        errors: [message],
      };
    }
  }

  async unbanUser(userId: string): Promise<ApiActionResult> {
    try {
      const response = await authClient.admin.unbanUser({
        userId,
      });

      if (response.error) {
        return {
          ok: false,
          statusCode: response.error.status || 500,
          errors: [response.error.message || "Error al desbloquear al usuario"],
        };
      }

      return { ok: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error inesperado al desbloquear usuario";
      return {
        ok: false,
        statusCode: 500,
        errors: [message],
      };
    }
  }
}
