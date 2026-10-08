"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { type AppRole } from "@/lib/auth-roles";
import { appToast } from "@/features/shared/presentation/components/notifications/toast";
import type { User } from "../../domain/entities/user.entity";
import { UserRepositoryImpl } from "../../infrastructure/repositories/user.repository-impl";

export type RoleFilter = "ALL" | AppRole;
export type StatusFilter = "ALL" | "ACTIVE" | "BANNED";

export function useUsers() {
  const { data: session } = authClient.useSession();
  const currentUserId = session?.user?.id;

  const userRepository = useMemo(() => new UserRepositoryImpl(), []);

  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Filtros de búsqueda en memoria
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("ALL");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await userRepository.getUsers(currentUserId);
      if (result.ok) {
        setUsers(result.data);
      } else {
        setError(result.errors[0] || "No se pudieron obtener los usuarios");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al cargar la lista de usuarios";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [userRepository, currentUserId]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Manejo de cambio de rol
  const handleRoleChange = useCallback(
    async (userId: string, newRole: AppRole): Promise<boolean> => {
      if (userId === currentUserId) {
        appToast.warning("No puedes cambiar tu propio rol de administrador.");
        return false;
      }

      setActionLoadingId(userId);
      try {
        const result = await userRepository.updateRole({ userId, role: newRole });
        if (result.ok) {
          setUsers((prev) =>
            prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
          );
          appToast.success(`Rol actualizado a ${newRole === "ADMIN" ? "Administrador" : "Consultor"}`);
          // Refrescar en segundo plano para asegurar consistencia
          void userRepository.getUsers(currentUserId).then((freshRes) => {
            if (freshRes.ok) setUsers(freshRes.data);
          });
          return true;
        } else {
          appToast.error(
            "Error al actualizar rol",
            result.errors[0] || "No se pudo actualizar el rol del usuario."
          );
          return false;
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Error inesperado al actualizar el rol";
        appToast.error("Error al actualizar rol", msg);
        return false;
      } finally {
        setActionLoadingId(null);
      }
    },
    [userRepository, currentUserId]
  );

  // Manejo de suspensión/bloqueo de usuario
  const handleBanUser = useCallback(
    async (
      userId: string,
      reason: string,
      durationInSeconds?: number | null
    ): Promise<boolean> => {
      if (userId === currentUserId) {
        appToast.warning("No puedes suspender tu propia cuenta de administrador.");
        return false;
      }

      setActionLoadingId(userId);
      try {
        const result = await userRepository.banUser({
          userId,
          banReason: reason,
          banExpiresIn: durationInSeconds,
        });

        if (result.ok) {
          const banExpires = durationInSeconds
            ? new Date(Date.now() + durationInSeconds * 1000)
            : null;

          setUsers((prev) =>
            prev.map((u) =>
              u.id === userId
                ? {
                    ...u,
                    banned: true,
                    banReason: reason,
                    banExpires,
                  }
                : u
            )
          );
          appToast.success("Usuario suspendido y sesiones revocadas exitosamente.");
          // Refrescar en segundo plano para asegurar sincronización con Better Auth
          void userRepository.getUsers(currentUserId).then((freshRes) => {
            if (freshRes.ok) setUsers(freshRes.data);
          });
          return true;
        } else {
          appToast.error(
            "Error al suspender usuario",
            result.errors[0] || "No se pudo suspender al usuario."
          );
          return false;
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Error inesperado al suspender el usuario";
        appToast.error("Error al suspender usuario", msg);
        return false;
      } finally {
        setActionLoadingId(null);
      }
    },
    [userRepository, currentUserId]
  );

  // Manejo de desbloqueo/reactivación de usuario
  const handleUnbanUser = useCallback(
    async (userId: string): Promise<boolean> => {
      if (userId === currentUserId) {
        return false;
      }

      setActionLoadingId(userId);
      try {
        const result = await userRepository.unbanUser(userId);
        if (result.ok) {
          setUsers((prev) =>
            prev.map((u) =>
              u.id === userId
                ? {
                    ...u,
                    banned: false,
                    banReason: null,
                    banExpires: null,
                  }
                : u
            )
          );
          appToast.success("Suspensión removida. El usuario puede volver a iniciar sesión.");
          // Refrescar en segundo plano
          void userRepository.getUsers(currentUserId).then((freshRes) => {
            if (freshRes.ok) setUsers(freshRes.data);
          });
          return true;
        } else {
          appToast.error(
            "Error al desbloquear usuario",
            result.errors[0] || "No se pudo levantar la suspensión del usuario."
          );
          return false;
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Error inesperado al reactivar usuario";
        appToast.error("Error al desbloquear usuario", msg);
        return false;
      } finally {
        setActionLoadingId(null);
      }
    },
    [userRepository, currentUserId]
  );

  // Filtrado de usuarios según query, rol y estado
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      // Filtro de búsqueda (nombre o email)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = user.name.toLowerCase().includes(query);
        const matchesEmail = user.email.toLowerCase().includes(query);
        if (!matchesName && !matchesEmail) {
          return false;
        }
      }

      // Filtro de rol
      if (roleFilter !== "ALL" && user.role !== roleFilter) {
        return false;
      }

      // Filtro de estado
      if (statusFilter === "ACTIVE" && user.banned) {
        return false;
      }
      if (statusFilter === "BANNED" && !user.banned) {
        return false;
      }

      return true;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  const resetFilters = useCallback(() => {
    setSearchQuery("");
    setRoleFilter("ALL");
    setStatusFilter("ALL");
  }, []);

  return {
    users,
    filteredUsers,
    totalCount: users.length,
    filteredCount: filteredUsers.length,
    isLoading,
    error,
    actionLoadingId,
    currentUserId,
    // Filtros
    searchQuery,
    setSearchQuery,
    roleFilter,
    setRoleFilter,
    statusFilter,
    setStatusFilter,
    resetFilters,
    // Acciones
    refetch: loadUsers,
    handleRoleChange,
    handleBanUser,
    handleUnbanUser,
  };
}
