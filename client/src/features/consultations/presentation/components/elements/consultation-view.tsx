"use client";

import React, { useMemo } from "react";
import { Search, AlertCircle, Database } from "lucide-react";
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
import { PageHeading } from "@/features/shared/presentation/components/layout/page-heading";
import { cn } from "@/lib/utils";
import type {
  CodigoFijoConsultation,
  LoteConsultation,
  ManzanaConsultation,
  ViaConsultation,
} from "../../../domain/entities/consultation.entity";
import { useConsultations } from "../../hooks/use-consultations";
import { ConsultationSearchForm } from "../forms/consultation-search-form";
import { CodigosFijosResultsView } from "./codigos-fijos-results-view";
import { LotesResultsView } from "./lotes-results-view";
import { ManzanasResultsView } from "./manzanas-results-view";
import { ViasResultsView } from "./vias-results-view";

function getPaginationPages(currentPage: number, totalPages: number): (number | "ellipsis")[] {
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

export function ConsultationView() {
  const {
    layer,
    setLayer,
    searchField,
    setSearchField,
    searchValue,
    setSearchValue,
    currentPage,
    isSearching,
    hasSearched,
    results,
    activeResultLayer,
    error,
    handleSearch,
    handlePageChange,
    handleReset,
  } = useConsultations();

  const paginationPages = useMemo(() => {
    if (!results || results.totalPages <= 1) return [];
    return getPaginationPages(results.page, results.totalPages);
  }, [results]);

  return (
    <div className="h-full w-full overflow-y-auto bg-slate-50/70 p-6 md:p-8 overscroll-contain">
      <div className="w-full space-y-7 pb-20 lg:pb-8">
        {/* Encabezado del Módulo (Estilo PageHeading idéntico a /capas) */}
        <PageHeading
          title="Consultas Alfanuméricas"
          description="Búsqueda e inspección de registros catastrales sobre capas de información geográfica."
        />

        {/* Formulario de Búsqueda (2 Selects + 1 Input) */}
        <ConsultationSearchForm
          layer={layer}
          onLayerChange={setLayer}
          searchField={searchField}
          onSearchFieldChange={setSearchField}
          searchValue={searchValue}
          onSearchValueChange={setSearchValue}
          onSearch={handleSearch}
          onReset={handleReset}
          isSearching={isSearching}
        />

        {/* Zona de Contenido y Resultados */}
        {isSearching ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-48 rounded-lg" />
              <Skeleton className="h-6 w-24 rounded-lg" />
            </div>
            <div className="rounded-2xl border bg-card p-6 space-y-3">
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center space-y-3">
            <AlertCircle className="size-8 text-destructive mx-auto" />
            <h3 className="text-sm font-semibold font-headline text-destructive">
              Error en la consulta
            </h3>
            <p className="text-xs font-sans text-muted-foreground max-w-md mx-auto">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSearch()}
              className="rounded-xl text-xs font-sans mt-2"
            >
              Reintentar
            </Button>
          </div>
        ) : !hasSearched ? (
          /* Estado inicial sin resultados ni datos precargados */
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white/60 p-12 text-center space-y-3">
            <div className="size-12 rounded-2xl bg-muted flex items-center justify-center mx-auto text-muted-foreground">
              <Database className="size-6" />
            </div>
            <h3 className="text-base font-semibold font-headline text-foreground">
              Listo para realizar consultas
            </h3>
            <p className="text-xs font-sans text-muted-foreground max-w-md mx-auto">
              Seleccione una capa cartográfica, elija el parámetro correspondiente e ingrese un valor de búsqueda para obtener resultados alfanuméricos.
            </p>
          </div>
        ) : results && results.items.length === 0 ? (
          /* Sin resultados encontrados */
          <div className="rounded-2xl border border-slate-200 bg-card p-12 text-center space-y-2 shadow-xs">
            <div className="size-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
              <Search className="size-6" />
            </div>
            <h3 className="text-base font-semibold font-headline text-foreground">
              No se encontraron registros
            </h3>
            <p className="text-xs font-sans text-muted-foreground max-w-md mx-auto">
              No existen registros que coincidan con el término ingresado para la capa seleccionada. Verifique los filtros aplicados.
            </p>
          </div>
        ) : results ? (
          /* Lista de resultados renderizada por la capa de la consulta activa */
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs sm:text-sm font-semibold font-sans text-foreground">
                Mostrando <span className="font-mono">{results.items.length}</span> de{" "}
                <span className="font-mono">{results.total}</span> registros
              </span>
              <span className="text-xs font-sans text-muted-foreground">
                Página <span className="font-mono">{results.page}</span> de{" "}
                <span className="font-mono">{results.totalPages}</span>
              </span>
            </div>

            {/* Vista especializada por capa (Desktop Table + Mobile/Tablet Cards) según consulta activa */}
            {activeResultLayer === "codigos-fijos" && (
              <CodigosFijosResultsView
                items={results.items as CodigoFijoConsultation[]}
              />
            )}

            {activeResultLayer === "lotes" && (
              <LotesResultsView items={results.items as LoteConsultation[]} />
            )}

            {activeResultLayer === "manzanas" && (
              <ManzanasResultsView items={results.items as ManzanaConsultation[]} />
            )}

            {activeResultLayer === "vias" && (
              <ViasResultsView items={results.items as ViaConsultation[]} />
            )}

            {/* Barra de Paginación Unificada con Shadcn UI Pagination */}
            {results.totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-border/70">
                <span className="text-xs font-medium font-sans text-muted-foreground order-2 sm:order-1">
                  Página <span className="font-mono font-semibold text-foreground">{results.page}</span> de{" "}
                  <span className="font-mono font-semibold text-foreground">{results.totalPages}</span>
                </span>

                <Pagination className="mx-0 w-auto justify-center sm:justify-end order-1 sm:order-2">
                  <PaginationContent className="font-sans gap-1">
                    <PaginationItem>
                      <PaginationPrevious
                        text="Anterior"
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (currentPage > 1 && !isSearching) {
                            handlePageChange(currentPage - 1);
                          }
                        }}
                        className={cn(
                          "cursor-pointer rounded-xl text-xs font-sans",
                          (currentPage <= 1 || isSearching) && "pointer-events-none opacity-40"
                        )}
                      />
                    </PaginationItem>

                    {paginationPages.map((p, idx) => (
                      <PaginationItem key={typeof p === "number" ? p : `ellipsis-${idx}`}>
                        {p === "ellipsis" ? (
                          <PaginationEllipsis className="font-sans text-xs size-8" />
                        ) : (
                          <PaginationLink
                            href="#"
                            isActive={results.page === p}
                            onClick={(e) => {
                              e.preventDefault();
                              if (!isSearching) {
                                handlePageChange(p);
                              }
                            }}
                            className={cn(
                              "cursor-pointer rounded-xl font-mono text-xs size-8 sm:size-9",
                              results.page === p &&
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
                          if (currentPage < results.totalPages && !isSearching) {
                            handlePageChange(currentPage + 1);
                          }
                        }}
                        className={cn(
                          "cursor-pointer rounded-xl text-xs font-sans",
                          (currentPage >= results.totalPages || isSearching) && "pointer-events-none opacity-40"
                        )}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
