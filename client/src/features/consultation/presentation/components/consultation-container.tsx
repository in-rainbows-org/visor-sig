"use client";

import React from "react";
import { ConsultationFilters } from "./consultation-filters";
import { ConsultationResultsTable } from "./consultation-results-table";
import { ConsultationPagination } from "./consultation-pagination";
import { useConsultation } from "../hooks/use-consultation";

export function ConsultationContainer() {
  const {
    layers,
    currentFields,
    selectedLayerKind,
    selectedField,
    searchValue,
    currentPage,
    isSearching,
    results,
    error,
    setSelectedLayerKind,
    setSelectedField,
    setSearchValue,
    handleSearch,
    handlePageChange,
    handleReset,
  } = useConsultation();

  return (
    <div className="w-full h-full min-h-full overflow-y-auto bg-white p-6 md:p-10 flex flex-col">
      <div className="w-full flex-1 flex flex-col relative max-w-7xl mx-auto">
        {/* Cabecera del Módulo */}
        <div className="mb-6 pr-8">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Consultas y filtros
          </h1>
          <p className="text-sm text-slate-500 mt-1.5 font-normal">
            Permite seleccionar capa, campo y valor, visualizar resultados paginados y acceder a la entidad seleccionada.
          </p>
        </div>

        {/* Sección de Filtros Alfanuméricos */}
        <ConsultationFilters
          layers={layers}
          fields={currentFields}
          selectedLayerKind={selectedLayerKind}
          selectedField={selectedField}
          searchValue={searchValue}
          isSearching={isSearching}
          onLayerChange={setSelectedLayerKind}
          onFieldChange={setSelectedField}
          onValueChange={setSearchValue}
          onSearch={handleSearch}
          onReset={handleReset}
        />

        {/* Sección de Resultados y Paginación */}
        <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col">
          <ConsultationResultsTable
            items={results?.items || []}
            total={results?.total || 0}
            isLoading={isSearching}
            error={error}
            onRetry={handleSearch}
          />

          {results && results.total > 0 && (
            <ConsultationPagination
              currentPage={currentPage}
              totalPages={results.totalPages}
              totalItems={results.total}
              pageSize={results.pageSize}
              onPageChange={handlePageChange}
            />
          )}
        </div>
      </div>
    </div>
  );
}
