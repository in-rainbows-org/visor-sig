"use client";

import React, { useMemo } from "react";
import { PageHeading } from "@/features/shared/presentation/components/layout/page-heading";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { RotateCw, AlertCircle, FileText } from "lucide-react";
import { useAuditLogs } from "../../hooks/use-audit-logs";
import { AuditLogsTable } from "./audit-logs-table";
import { AuditLogCard } from "./audit-log-card";
import { cn } from "@/lib/utils";

function getPaginationPages(
  currentPage: number,
  totalPages: number
): (number | "ellipsis")[] {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const pages: (number | "ellipsis")[] = [1];
  if (currentPage > 3) {
    pages.push("ellipsis");
  }
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  if (currentPage < totalPages - 2) {
    pages.push("ellipsis");
  }
  pages.push(totalPages);
  return pages;
}

export function AuditLogsView() {
  const {
    items,
    totalCount,
    currentPage,
    totalPages,
    isLoading,
    error,
    handlePageChange,
    refetch,
  } = useAuditLogs();

  const paginationPages = useMemo(() => {
    if (totalPages <= 1) return [];
    return getPaginationPages(currentPage, totalPages);
  }, [currentPage, totalPages]);

  return (
    <div className="h-full w-full overflow-y-auto bg-slate-50/70 p-6 md:p-8">
      <div className="w-full space-y-6 pb-20 lg:pb-8">
        {/* Encabezado Principal */}
        <PageHeading
          title="Bitácora del Sistema"
          description="Registro cronológico e inmutable de actividades y eventos operativos ejecutados en la plataforma."
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
              className="gap-2 rounded-xl text-xs font-semibold bg-white border-slate-200 shadow-2xs hover:bg-slate-50"
            >
              <RotateCw className={`size-3.5 ${isLoading ? "animate-spin" : ""}`} />
              <span>Actualizar bitácora</span>
            </Button>
          }
        />

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
              Error al obtener registros de la bitácora
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
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-12 text-center space-y-3">
            <div className="size-12 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
              <FileText className="size-6" />
            </div>
            <h3 className="text-base font-semibold font-headline text-slate-800">
              No hay actividades registradas
            </h3>
            <p className="text-xs font-sans text-slate-500 max-w-md mx-auto">
              Aún no se han producido eventos o acciones auditables en el sistema.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Contador de Registros */}
            <div className="flex items-center justify-between px-1">
              <span className="text-xs sm:text-sm font-semibold text-slate-700">
                Mostrando <span className="font-mono">{items.length}</span> registros (Total:{" "}
                <span className="font-mono">{totalCount}</span>)
              </span>
            </div>

            {/* Desktop Table (>= 1024px) */}
            <div className="hidden lg:block">
              <AuditLogsTable items={items} />
            </div>

            {/* Mobile / Tablet Cards (< 1024px) */}
            <div className="block lg:hidden">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {items.map((item) => (
                  <AuditLogCard key={item.id} item={item} />
                ))}
              </div>
            </div>

            {/* Barra de Paginación */}
            {totalPages > 1 && (
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200/80 px-1">
                <span className="text-xs text-muted-foreground order-2 sm:order-1">
                  Página <span className="font-mono font-semibold text-foreground">{currentPage}</span> de{" "}
                  <span className="font-mono font-semibold text-foreground">{totalPages}</span>
                </span>

                <Pagination className="mx-0 w-auto justify-center sm:justify-end order-1 sm:order-2">
                  <PaginationContent className="font-sans gap-1">
                    <PaginationItem>
                      <PaginationPrevious
                        text="Anterior"
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (currentPage > 1 && !isLoading) {
                            handlePageChange(currentPage - 1);
                          }
                        }}
                        className={cn(
                          "cursor-pointer rounded-xl text-xs font-sans",
                          (currentPage <= 1 || isLoading) &&
                            "pointer-events-none opacity-40"
                        )}
                      />
                    </PaginationItem>

                    {paginationPages.map((p, idx) => (
                      <PaginationItem
                        key={typeof p === "number" ? p : `ellipsis-${idx}`}
                      >
                        {p === "ellipsis" ? (
                          <PaginationEllipsis className="font-sans text-xs size-8" />
                        ) : (
                          <PaginationLink
                            href="#"
                            isActive={currentPage === p}
                            onClick={(e) => {
                              e.preventDefault();
                              if (!isLoading) {
                                handlePageChange(p);
                              }
                            }}
                            className={cn(
                              "cursor-pointer rounded-xl font-mono text-xs size-8 sm:size-9",
                              currentPage === p &&
                                "bg-app-primary text-app-primary-foreground font-semibold hover:bg-app-primary hover:text-app-primary-foreground border-transparent"
                            )}
                          >
                            {p}
                          </PaginationLink>
                        )}
                      </PaginationItem>
                    ))}

                    <PaginationItem>
                      <PaginationNext
                        text="Siguiente"
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (currentPage < totalPages && !isLoading) {
                            handlePageChange(currentPage + 1);
                          }
                        }}
                        className={cn(
                          "cursor-pointer rounded-xl text-xs font-sans",
                          (currentPage >= totalPages || isLoading) &&
                            "pointer-events-none opacity-40"
                        )}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
