"use client";

import { useCallback, useState } from "react";
import type {
  CodigoFijoConsultation,
  ConsultationLayerKind,
  LoteConsultation,
  ManzanaConsultation,
  PaginatedConsultationResult,
  ViaConsultation,
} from "../../domain/entities/consultation.entity";
import { consultationRepositoryImpl } from "../../infrastructure/repositories/consultation.repository-impl";

export type AnyConsultationRecord =
  | CodigoFijoConsultation
  | LoteConsultation
  | ManzanaConsultation
  | ViaConsultation;

export function useConsultations() {
  const [layer, setLayer] = useState<ConsultationLayerKind>("codigos-fijos");
  const [searchField, setSearchField] = useState<string>("fixed_code");
  const [searchValue, setSearchValue] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 10;

  // Consulta activa que produjo los resultados mostrados actualmente
  const [activeQuery, setActiveQuery] = useState<{
    layer: ConsultationLayerKind;
    searchField: string;
    searchValue: string;
  } | null>(null);

  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [results, setResults] = useState<PaginatedConsultationResult<AnyConsultationRecord> | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Ejecución de la consulta según los parámetros especificados
  const executeSearch = useCallback(
    async (
      targetLayer: ConsultationLayerKind,
      targetField: string,
      targetValue: string,
      pageToLoad: number = 1
    ) => {
      setIsSearching(true);
      setError(null);

      const trimmedVal = targetValue.trim();

      try {
        let res;
        if (targetLayer === "codigos-fijos") {
          const isNum = targetField === "fixed_code" && /^\d+$/.test(trimmedVal);
          res = await consultationRepositoryImpl.getCodigosFijos({
            fixedCode: isNum ? parseInt(trimmedVal, 10) : undefined,
            name: targetField === "name" && trimmedVal ? trimmedVal : undefined,
            page: pageToLoad,
            pageSize,
          });
        } else if (targetLayer === "lotes") {
          res = await consultationRepositoryImpl.getLotes({
            lotNumber: targetField === "lot_number" && trimmedVal ? trimmedVal : undefined,
            page: pageToLoad,
            pageSize,
          });
        } else if (targetLayer === "manzanas") {
          res = await consultationRepositoryImpl.getManzanas({
            uvBlockCode: targetField === "uv_block_code" && trimmedVal ? trimmedVal : undefined,
            uv: targetField === "uv" && trimmedVal ? trimmedVal : undefined,
            blockNumber: targetField === "block_number" && trimmedVal ? trimmedVal : undefined,
            page: pageToLoad,
            pageSize,
          });
        } else if (targetLayer === "vias") {
          res = await consultationRepositoryImpl.getVias({
            roadType: targetField === "road_type" && trimmedVal ? trimmedVal : undefined,
            name: targetField === "name" && trimmedVal ? trimmedVal : undefined,
            page: pageToLoad,
            pageSize,
          });
        }

        if (res && res.ok) {
          setResults(res.data);
          setCurrentPage(res.data.page);
          setHasSearched(true);
          setActiveQuery({
            layer: targetLayer,
            searchField: targetField,
            searchValue: targetValue,
          });
        } else {
          setError(res?.errors[0] || "Error al realizar la consulta.");
          setResults(null);
        }
      } catch {
        setError("Ocurrió un error inesperado al realizar la consulta.");
        setResults(null);
      } finally {
        setIsSearching(false);
      }
    },
    []
  );

  // Cambio de página manteniendo los filtros de la consulta activa
  const handlePageChange = useCallback(
    (newPage: number) => {
      if (
        newPage === currentPage ||
        newPage < 1 ||
        (results && newPage > results.totalPages) ||
        !activeQuery
      ) {
        return;
      }
      executeSearch(
        activeQuery.layer,
        activeQuery.searchField,
        activeQuery.searchValue,
        newPage
      );
    },
    [currentPage, results, activeQuery, executeSearch]
  );

  // Reiniciar formulario y resultados
  const handleReset = useCallback(() => {
    setSearchValue("");
    setCurrentPage(1);
    setResults(null);
    setHasSearched(false);
    setError(null);
    setActiveQuery(null);
  }, []);

  // Manejo de la búsqueda desde el formulario con los valores actuales
  const handleSearch = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault();
      executeSearch(layer, searchField, searchValue, 1);
    },
    [executeSearch, layer, searchField, searchValue]
  );

  return {
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
    activeResultLayer: activeQuery?.layer ?? null,
    error,
    handleSearch,
    handlePageChange,
    handleReset,
  };
}
