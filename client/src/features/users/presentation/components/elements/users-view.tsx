"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { PageHeading } from "@/features/shared/presentation/components/layout/page-heading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  RotateCw,
  AlertCircle,
  Users as UsersIcon,
  FilterX,
  Shield,
  CheckCircle2,
} from "lucide-react";
import { useUsers, type RoleFilter, type StatusFilter } from "../../hooks/use-users";
import { UsersTable } from "./users-table";
import { UserCard } from "./user-card";
import { BanUserDialog } from "../dialogs/ban-user-dialog";
import type { User } from "../../../domain/entities/user.entity";
import { APP_ROLES } from "@/lib/auth-roles";

export function UsersView() {
  const router = useRouter();
  const { data: session, isPending: isSessionPending } = authClient.useSession();

  const {
    filteredUsers,
    totalCount,
    filteredCount,
    isLoading,
    error,
    actionLoadingId,
    searchQuery,
    setSearchQuery,
    roleFilter,
    setRoleFilter,
    statusFilter,
    setStatusFilter,
    resetFilters,
    refetch,
    handleRoleChange,
    handleBanUser,
    handleUnbanUser,
  } = useUsers();

  useEffect(() => {
    if (!isSessionPending && session?.user && session.user.role !== APP_ROLES.ADMIN) {
      router.replace("/mapa");
    }
  }, [session, isSessionPending, router]);

  const [banTargetUser, setBanTargetUser] = useState<User | null>(null);
  const [isBanDialogOpen, setIsBanDialogOpen] = useState(false);
  const [isSubmittingBan, setIsSubmittingBan] = useState(false);

  const handleOpenBanDialog = (user: User) => {
    setBanTargetUser(user);
    setIsBanDialogOpen(true);
  };

  const handleCloseBanDialog = () => {
    setIsBanDialogOpen(false);
    setBanTargetUser(null);
  };

  const handleConfirmBan = async (
    userId: string,
    reason: string,
    durationInSeconds?: number | null
  ): Promise<boolean> => {
    setIsSubmittingBan(true);
    try {
      const ok = await handleBanUser(userId, reason, durationInSeconds);
      return ok;
    } finally {
      setIsSubmittingBan(false);
    }
  };

  const hasActiveFilters =
    searchQuery.trim() !== "" || roleFilter !== "ALL" || statusFilter !== "ALL";

  return (
    <div className="h-full w-full overflow-y-auto bg-slate-50/70 p-6 md:p-8">
      <div className="w-full space-y-6 pb-20 lg:pb-8">
        {/* Encabezado Principal */}
        <PageHeading
          title="Gestión de Usuarios"
          description="Administración de cuentas, roles de acceso y moderación de miembros de la plataforma."
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
              className="gap-2 rounded-xl text-xs font-semibold bg-white border-slate-200 shadow-2xs hover:bg-slate-50"
            >
              <RotateCw className={`size-3.5 ${isLoading ? "animate-spin" : ""}`} />
              <span>Actualizar lista</span>
            </Button>
          }
        />

        {/* Barra de Búsqueda y Filtros */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Input de Búsqueda */}
            <div className="lg:col-span-2 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nombre o correo..."
                className="pl-10 h-10 bg-slate-50/80 border-slate-200 rounded-xl text-xs placeholder:text-slate-400 focus-visible:bg-white transition-colors"
              />
            </div>

            {/* Filtro de Rol */}
            <div>
              <Select
                value={roleFilter}
                onValueChange={(val) => setRoleFilter(val as RoleFilter)}
              >
                <SelectTrigger className="h-10 bg-slate-50/80 border-slate-200 rounded-xl text-xs">
                  <div className="flex items-center gap-1.5 truncate">
                    <Shield className="size-3.5 text-slate-400 shrink-0" />
                    <SelectValue placeholder="Rol: Todos" />
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 rounded-xl text-xs z-[2000]">
                  <SelectItem value="ALL">Todos los roles</SelectItem>
                  <SelectItem value={APP_ROLES.ADMIN}>Administradores</SelectItem>
                  <SelectItem value={APP_ROLES.CONSULTANT}>Consultores</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filtro de Estado */}
            <div className="flex items-center gap-2">
              <div className="w-full">
                <Select
                  value={statusFilter}
                  onValueChange={(val) => setStatusFilter(val as StatusFilter)}
                >
                  <SelectTrigger className="h-10 bg-slate-50/80 border-slate-200 rounded-xl text-xs">
                    <div className="flex items-center gap-1.5 truncate">
                      <CheckCircle2 className="size-3.5 text-slate-400 shrink-0" />
                      <SelectValue placeholder="Estado: Todos" />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 rounded-xl text-xs z-[2000]">
                    <SelectItem value="ALL">Todos los estados</SelectItem>
                    <SelectItem value="ACTIVE">Activos</SelectItem>
                    <SelectItem value="BANNED">Bloqueados</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={resetFilters}
                  title="Limpiar filtros"
                  className="rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 shrink-0 size-10"
                >
                  <FilterX className="size-4" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Zona de Contenido */}
        {isLoading ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <Skeleton className="h-5 w-44 rounded-lg" />
            </div>
            {/* Skeleton Desktop */}
            <div className="hidden lg:block rounded-2xl border border-slate-200/80 bg-white p-6 space-y-4">
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>
            {/* Skeleton Mobile */}
            <div className="block lg:hidden space-y-3">
              <Skeleton className="h-32 w-full rounded-2xl" />
              <Skeleton className="h-32 w-full rounded-2xl" />
            </div>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center space-y-3">
            <AlertCircle className="size-8 text-destructive mx-auto" />
            <h3 className="text-sm font-semibold font-headline text-destructive">
              Error al obtener usuarios
            </h3>
            <p className="text-xs font-sans text-muted-foreground max-w-md mx-auto">
              {error}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="rounded-xl text-xs font-sans mt-2"
            >
              Reintentar
            </Button>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-12 text-center space-y-3">
            <div className="size-12 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
              <UsersIcon className="size-6" />
            </div>
            <h3 className="text-base font-semibold font-headline text-slate-800">
              {hasActiveFilters
                ? "No se encontraron usuarios"
                : "No hay usuarios registrados"}
            </h3>
            <p className="text-xs font-sans text-slate-500 max-w-md mx-auto">
              {hasActiveFilters
                ? "Ningún usuario coincide con los criterios de búsqueda o filtros seleccionados."
                : "No se encontraron registros de usuarios en el sistema."}
            </p>
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={resetFilters}
                className="rounded-xl text-xs gap-1.5 mt-2"
              >
                <FilterX className="size-3.5" />
                Limpiar filtros
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Contador de Registros */}
            <div className="flex items-center justify-between px-1">
              <span className="text-xs sm:text-sm font-semibold text-slate-700">
                Mostrando <span className="font-mono">{filteredCount}</span> de{" "}
                <span className="font-mono">{totalCount}</span> usuarios
              </span>
            </div>

            {/* Desktop Table (>= 1024px) */}
            <div className="hidden lg:block">
              <UsersTable
                users={filteredUsers}
                actionLoadingId={actionLoadingId}
                onRoleChange={handleRoleChange}
                onRequestBan={handleOpenBanDialog}
                onUnban={handleUnbanUser}
              />
            </div>

            {/* Mobile / Tablet Cards (< 1024px) */}
            <div className="block lg:hidden">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {filteredUsers.map((user) => (
                  <UserCard
                    key={user.id}
                    user={user}
                    isActionLoading={actionLoadingId === user.id}
                    onRoleChange={handleRoleChange}
                    onRequestBan={handleOpenBanDialog}
                    onUnban={handleUnbanUser}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Modal de Bloqueo de Usuario */}
        <BanUserDialog
          user={banTargetUser}
          isOpen={isBanDialogOpen}
          onClose={handleCloseBanDialog}
          onConfirm={handleConfirmBan}
          isSubmitting={isSubmittingBan}
        />
      </div>
    </div>
  );
}
