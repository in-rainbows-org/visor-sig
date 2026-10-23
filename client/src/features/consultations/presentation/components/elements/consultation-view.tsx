"use client";

import React, { useMemo } from "react";
import { Search, AlertCircle, Database } from "lucide-react";
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
import { PageHero } from "@/features/shared/presentation/components/layout/page-hero";
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

function ConsultationResultsSkeleton() {
  return (
    <div className="space-y-4 select-none">
      {/* Título de Sección Skeleton */}
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
                <div className="size-8 rounded-2xl bg-slate-100" />
                <div className="h-4 w-28 bg-slate-100 rounded-full" />
              </div>
              <div className="h-5 w-16 bg-slate-100 rounded-full" />
            </div>
            <div className="h-12 w-full rounded-2xl bg-slate-50/80" />
          </div>
        ))}
      </div>
    </div>
  );
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
    <div className="h-full w-full overflow-y-auto bg-slate-50/70 overscroll-contain">
      {/* Hero del módulo, apegado a la cabecera primaria */}
      <PageHero
        title="Consultas Alfanuméricas"
        description="Búsqueda e inspección de registros catastrales"
        iconSrc="/hero-icons/consulta-hero.png"
        iconAlt="Ilustración de Consultas"
      />

      <div className="w-full space-y-4 sm:space-y-6 p-4 sm:p-6 md:p-8 pb-24 lg:pb-8">

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
          <ConsultationResultsSkeleton />
        ) : error ? (
          <div className="rounded-2xl sm:rounded-3xl border border-destructive/20 bg-destructive/5 p-8 text-center space-y-3">
            <AlertCircle className="size-8 text-destructive mx-auto" />
            <h3 className="text-sm font-semibold font-headline text-destructive">
              Error en la consulta
            </h3>
            <p className="text-xs font-sans text-muted-foreground max-w-md mx-auto">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSearch()}
              className="rounded-full text-xs font-sans mt-2"
            >
              Reintentar
            </Button>
          </div>
        ) : !hasSearched ? (
          /* Estado inicial sin resultados ni datos precargados */
          <div className="rounded-2xl sm:rounded-3xl bg-white border-0 shadow-none p-12 text-center space-y-3 select-none">
            <div className="size-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-500">
              <Database className="size-6" />
            </div>
            <h3 className="text-base font-semibold font-headline text-slate-900">
              Listo para realizar consultas
            </h3>
            <p className="text-xs font-sans text-slate-500 max-w-md mx-auto leading-relaxed">
              Seleccione una capa cartográfica, elija el parámetro correspondiente e ingrese un valor de búsqueda para obtener resultados alfanuméricos.
            </p>
          </div>
        ) : results && results.items.length === 0 ? (
          /* Sin resultados encontrados */
          <div className="rounded-2xl sm:rounded-3xl bg-white border-0 shadow-none p-12 text-center space-y-3 select-none">
            <div className="size-14 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mx-auto">
              <Search className="size-6" />
            </div>
            <h3 className="text-base font-semibold font-headline text-slate-900">
              No se encontraron registros
            </h3>
            <p className="text-xs font-sans text-slate-500 max-w-md mx-auto leading-relaxed">
              No existen registros que coincidan con el término ingresado para la capa seleccionada. Verifique los filtros aplicados.
            </p>
          </div>
        ) : results ? (
          /* Lista de resultados renderizada por la capa de la consulta activa */
          <div className="space-y-4">
            {/* Título de Sección */}
            <div className="px-0.5">
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Resultados de la Consulta
              </h3>
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
              <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-3 select-none">
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white text-xs font-medium text-slate-500 border-0 shadow-none order-2 sm:order-1">
                  <span>Página</span>
                  <span className="font-semibold text-slate-900 font-mono">{results.page}</span>
                  <span>de</span>
                  <span className="font-semibold text-slate-900 font-mono">{results.totalPages}</span>
                </div>

                <Pagination className="mx-0 w-auto justify-center sm:justify-end order-1 sm:order-2">
                  <PaginationContent className="bg-white rounded-full p-1 gap-1 border-0 shadow-none">
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
                          "cursor-pointer rounded-full h-8 px-3 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 border-0 shadow-none transition-all",
                          (currentPage <= 1 || isSearching) &&
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
                            isActive={results.page === p}
                            onClick={(e) => {
                              e.preventDefault();
                              if (!isSearching) {
                                handlePageChange(p);
                              }
                            }}
                            className={cn(
                              "cursor-pointer rounded-full size-8 p-0 font-mono text-xs transition-all border-0 shadow-none",
                              results.page === p
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
                          if (currentPage < results.totalPages && !isSearching) {
                            handlePageChange(currentPage + 1);
                          }
                        }}
                        className={cn(
                          "cursor-pointer rounded-full h-8 px-3 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 border-0 shadow-none transition-all",
                          (currentPage >= results.totalPages || isSearching) &&
                            "pointer-events-none opacity-30"
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
