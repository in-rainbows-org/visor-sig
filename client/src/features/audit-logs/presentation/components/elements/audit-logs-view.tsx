"use client";

import React, { useMemo, useState, useEffect } from "react";
import { PageHero } from "@/features/shared/presentation/components/layout/page-hero";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { AlertCircle, FileText } from "lucide-react";
import { useAuditLogs } from "../../hooks/use-audit-logs";
import { AuditLogsTable } from "./audit-logs-table";
import { AuditLogCard } from "./audit-log-card";
import { ScrollArea } from "@/components/ui/scroll-area";
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

  // Efecto desvanecido dinámico en inicio y final del contenedor de tarjetas
  const [scrollFade, setScrollFade] = useState<{
    canScrollUp: boolean;
    canScrollDown: boolean;
  }>({
    canScrollUp: false,
    canScrollDown: true,
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
    setScrollFade({
      canScrollUp: false,
      canScrollDown: items.length > 3,
    });
  }, [items, currentPage]);

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
    <div className="h-full w-full overflow-y-auto bg-slate-50/70 overscroll-contain">
      {/* Hero del módulo, apegado a la cabecera primaria */}
      <PageHero
        title="Bitácora del Sistema"
        description="Registro cronológico e inmutable de actividades y eventos operativos"
        iconSrc="/hero-icons/bitacora-hero.png"
        iconAlt="Ilustración de la Bitácora"
      />

      <div className="w-full space-y-4 sm:space-y-6 p-4 sm:p-6 md:p-8 pb-24 lg:pb-8">

        {/* Zona de Contenido */}
        {error ? (
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
        ) : items.length === 0 && !isLoading ? (
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
          <div className={cn("space-y-4 transition-opacity duration-200", isLoading && "opacity-60 pointer-events-none")}>
            {/* Título de Sección */}
            <div className="px-0.5">
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Registro de Actividades
              </h3>
            </div>

            {/* Desktop Table (>= 1024px) */}
            <div className="hidden lg:block">
              <AuditLogsTable items={items} />
            </div>

            {/* Mobile / Tablet Cards (< 1024px) con ScrollArea propio y desvanecido en extremos */}
            <div className="block lg:hidden">
              <ScrollArea
                className="h-[580px] max-h-[calc(100dvh-12rem)] min-h-[460px] sm:h-[640px] w-full"
                viewportStyle={mobileMaskStyle}
                onScroll={handleMobileCardsScroll}
              >
                <div className="space-y-3 pr-2.5 pt-1.5 pb-3">
                  {items.map((item) => (
                    <AuditLogCard key={item.id} item={item} />
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Barra de Paginación */}
            {totalPages > 1 && (
              <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-3 select-none">
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white text-xs font-medium text-slate-500 border-0 shadow-none order-2 sm:order-1">
                  <span>Página</span>
                  <span className="font-semibold text-slate-900 font-mono">{currentPage}</span>
                  <span>de</span>
                  <span className="font-semibold text-slate-900 font-mono">{totalPages}</span>
                </div>

                <Pagination className="mx-0 w-auto justify-center sm:justify-end order-1 sm:order-2">
                  <PaginationContent className="bg-white rounded-full p-1 gap-1 border-0 shadow-none">
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
                          "cursor-pointer rounded-full h-8 px-3 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 border-0 shadow-none transition-all",
                          (currentPage <= 1 || isLoading) &&
                            "pointer-events-none opacity-30"
                        )}
                      />
                    </PaginationItem>

                    {paginationPages.map((p, idx) => (
                      <PaginationItem
                        key={typeof p === "number" ? p : `ellipsis-${idx}`}
                      >
                        {p === "ellipsis" ? (
                          <PaginationEllipsis className="font-sans text-xs size-8 text-slate-400" />
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
                              "cursor-pointer rounded-full size-8 p-0 font-mono text-xs transition-all border-0 shadow-none",
                              currentPage === p
                                ? "bg-app-primary text-app-primary-foreground font-semibold hover:bg-app-primary hover:text-app-primary-foreground"
                                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
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
                          "cursor-pointer rounded-full h-8 px-3 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 border-0 shadow-none transition-all",
                          (currentPage >= totalPages || isLoading) &&
                            "pointer-events-none opacity-30"
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
