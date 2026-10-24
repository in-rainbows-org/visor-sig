"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { PageHero } from "@/features/shared/presentation/components/layout/page-hero";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertCircle, Users as UsersIcon, FilterX } from "lucide-react";
import { useUsers } from "../../hooks/use-users";
import { UsersSearchForm } from "../forms/users-search-form";
import { UsersTable } from "./users-table";
import { UserCard } from "./user-card";
import { BanUserDialog } from "../dialogs/ban-user-dialog";
import type { User } from "../../../domain/entities/user.entity";
import { APP_ROLES } from "@/lib/auth-roles";

function UsersSkeleton() {
  return (
    <div className="space-y-4 select-none">
      <div className="px-0.5">
        <div className="h-7 w-56 rounded-lg bg-slate-200/70 animate-pulse" />
      </div>

      {/* Skeleton Desktop: Tabla plana */}
      <div className="hidden lg:block rounded-2xl sm:rounded-3xl bg-white p-6 space-y-4 border-0 shadow-none animate-pulse">
        <div className="h-8 w-full rounded-xl bg-slate-100" />
        <div className="h-12 w-full rounded-xl bg-slate-50/80" />
        <div className="h-12 w-full rounded-xl bg-slate-50/80" />
        <div className="h-12 w-full rounded-xl bg-slate-50/80" />
        <div className="h-12 w-full rounded-xl bg-slate-50/80" />
      </div>

      {/* Skeleton Mobile: Tarjetas planas */}
      <div className="block lg:hidden space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-2xl sm:rounded-3xl bg-white border-0 shadow-none p-4 sm:p-5 space-y-3 animate-pulse"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="size-9 rounded-full bg-slate-200" />
                <div className="h-4 w-28 bg-slate-200 rounded-full" />
              </div>
              <div className="h-6 w-20 bg-slate-100 rounded-full" />
            </div>
            <div className="h-12 w-full rounded-2xl bg-slate-50/80" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function UsersView() {
  const router = useRouter();
  const { data: session, isPending: isSessionPending } = authClient.useSession();

  const {
    filteredUsers,
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

  // Efecto desvanecido dinámico para el contenedor de tarjetas móviles
  const [scrollFade, setScrollFade] = useState<{
    canScrollUp: boolean;
    canScrollDown: boolean;
  }>({
    canScrollUp: false,
    canScrollDown: filteredUsers.length > 3,
  });

  const handleMobileCardsScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const canScrollUp = el.scrollTop > 8;
    const canScrollDown = el.scrollTop + el.clientHeight < el.scrollHeight - 8;
    setScrollFade((prev) => {
      if (prev.canScrollUp === canScrollUp && prev.canScrollDown === canScrollDown) {
        return prev;
      }
      return { canScrollUp, canScrollDown };
    });
  };

  useEffect(() => {
    const canScrollDown = filteredUsers.length > 3;
    setScrollFade((prev) => {
      if (prev.canScrollUp === false && prev.canScrollDown === canScrollDown) {
        return prev;
      }
      return { canScrollUp: false, canScrollDown };
    });
  }, [filteredUsers.length]);

  const mobileMaskStyle = useMemo<React.CSSProperties>(() => {
    const { canScrollUp, canScrollDown } = scrollFade;
    const fade = "28px";
    if (canScrollUp && canScrollDown) {
      const gradient = `linear-gradient(to bottom, transparent 0%, black ${fade}, black calc(100% - ${fade}), transparent 100%)`;
      return {
        maskImage: gradient,
        WebkitMaskImage: gradient,
      };
    }
    if (canScrollUp) {
      const gradient = `linear-gradient(to bottom, transparent 0%, black ${fade}, black 100%)`;
      return {
        maskImage: gradient,
        WebkitMaskImage: gradient,
      };
    }
    if (canScrollDown) {
      const gradient = `linear-gradient(to bottom, black 0%, black calc(100% - ${fade}), transparent 100%)`;
      return {
        maskImage: gradient,
        WebkitMaskImage: gradient,
      };
    }
    return {};
  }, [scrollFade]);

  return (
    <div className="h-full w-full lg:-ml-[32px] lg:pl-[32px] lg:w-[calc(100%+32px)] overflow-y-auto bg-slate-50/70 overscroll-contain">
      {/* Hero del módulo, apegado a la cabecera primaria */}
      <PageHero
        title="Gestión de Usuarios"
        description="Administración de cuentas, roles de acceso y moderación de miembros"
        iconSrc="/hero-icons/usuarios-hero.png"
        iconAlt="Ilustración de Gestión de Usuarios"
      />

      <div className="w-full space-y-4 sm:space-y-6 p-4 sm:p-6 md:p-8 pb-24 lg:pb-8">
        {/* Formulario de Búsqueda y Filtros en componente independiente */}
        <UsersSearchForm
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          roleFilter={roleFilter}
          onRoleFilterChange={setRoleFilter}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          hasActiveFilters={hasActiveFilters}
          onResetFilters={resetFilters}
        />

        {/* Zona de Contenido */}
        {isLoading ? (
          <UsersSkeleton />
        ) : error ? (
          <div className="rounded-2xl sm:rounded-3xl border border-destructive/20 bg-destructive/5 p-8 text-center space-y-3">
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
              className="rounded-full text-xs font-sans mt-2 cursor-pointer"
            >
              Reintentar
            </Button>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="rounded-2xl sm:rounded-3xl bg-white border-0 shadow-none p-12 text-center space-y-3 select-none">
            <div className="size-14 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
              <UsersIcon className="size-6" />
            </div>
            <h3 className="text-base font-semibold font-headline text-slate-900">
              {hasActiveFilters
                ? "No se encontraron usuarios"
                : "No hay usuarios registrados"}
            </h3>
            <p className="text-xs font-sans text-slate-500 max-w-md mx-auto leading-relaxed">
              {hasActiveFilters
                ? "Ningún usuario coincide con los criterios de búsqueda o filtros seleccionados."
                : "No se encontraron registros de usuarios en el sistema."}
            </p>
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={resetFilters}
                className="rounded-full text-xs gap-1.5 mt-2 border-0 bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer"
              >
                <FilterX className="size-3.5" />
                Limpiar filtros
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Título de Sección */}
            <div className="px-0.5">
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Usuarios del Sistema
              </h3>
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

            {/* Mobile / Tablet Cards (< 1024px) con ScrollArea y desvanecido en extremos */}
            <div className="block lg:hidden">
              <ScrollArea
                className="h-[580px] max-h-[calc(100dvh-12rem)] min-h-[460px] sm:h-[640px] w-full"
                viewportStyle={mobileMaskStyle}
                onScroll={handleMobileCardsScroll}
              >
                <div className="space-y-3.5 pr-2.5 pt-1.5 pb-3">
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
              </ScrollArea>
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
