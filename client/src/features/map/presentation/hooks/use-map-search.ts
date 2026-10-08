"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { SearchResultItem } from "@/features/map/domain/entities/map.entity";
import type { HighlightedMapEntity } from "@/features/map/domain/entities/highlighted-entity.entity";
import { consultationRepositoryImpl } from "@/features/consultations/infrastructure/repositories/consultation.repository-impl";

export type UseMapSearchOptions = {
  highlightedEntity?: HighlightedMapEntity | null;
  onSelectEntity?: (entity: HighlightedMapEntity) => void;
  onClear?: () => void;
  initialQuery?: string;
  enableDebounce?: boolean;
};

export function useMapSearch({
  onSelectEntity,
  onClear,
  initialQuery,
  enableDebounce = false,
}: UseMapSearchOptions = {}) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery ?? "");
  const [filterType, setFilterType] = useState<"codigo" | "nombre">("codigo");
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Consulta a la API de consultas de entidades geográficas
  const executeSearch = useCallback(
    async (searchQuery?: string, type?: "codigo" | "nombre") => {
      const activeQuery = (searchQuery !== undefined ? searchQuery : query).trim();
      const activeType = type || filterType;

      if (!activeQuery) {
        setResults([]);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      try {
        const isNum = activeType === "codigo" && /^\d+$/.test(activeQuery);
        const res = await consultationRepositoryImpl.getCodigosFijos({
          fixedCode: isNum ? parseInt(activeQuery, 10) : undefined,
          name: activeType === "nombre" ? activeQuery : undefined,
          page: 1,
          pageSize: 20,
        });

        if (res.ok) {
          const mappedItems: SearchResultItem[] = res.data.items.map((item) => {
            const name = item.name || "Sin titular registrado";
            const statusVal = item.status;
            const lote = item.lotNumber || "No asignado";

            const actionTag =
              statusVal === 1
                ? "Activo"
                : statusVal === 2
                ? "Pendiente"
                : statusVal === 3
                ? "Cortado"
                : statusVal === 4
                ? "Inactivo"
                : statusVal === 5
                ? "Baja"
                : `Estado ${statusVal}`;

            const tagColor =
              statusVal === 1
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : statusVal === 2
                ? "bg-amber-50 text-amber-700 border-amber-200"
                : statusVal === 3
                ? "bg-rose-50 text-rose-700 border-rose-200"
                : statusVal === 4
                ? "bg-slate-100 text-slate-700 border-slate-300"
                : statusVal === 5
                ? "bg-red-50 text-red-700 border-red-200"
                : "bg-slate-100 text-slate-700 border-slate-300";

            return {
              id: item.id,
              code: String(item.fixedCode || item.label || "CF"),
              fixedCode: item.fixedCode,
              label: item.label,
              name,
              lotNumber: item.lotNumber,
              zone: item.lotNumber ? `Lote ${item.lotNumber}` : "Sin lote asignado",
              lat: -16.382,
              lng: -60.957,
              actionTag,
              tagColor,
              score: 1.0,
              uv: "14",
              mz: "08",
              lote,
              statusVal,
              status: item.status,
            };
          });

          setResults(mappedItems);
        } else {
          setResults([]);
        }
      } catch {
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    },
    [query, filterType]
  );

  // Debounce automático al escribir (si está habilitado)
  useEffect(() => {
    if (!enableDebounce) return;

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      executeSearch(query, filterType);
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, filterType, executeSearch, enableDebounce]);

  const handleClear = useCallback(() => {
    setQuery("");
    setResults([]);
    onClear?.();
  }, [onClear]);

  const handleFilterTypeChange = useCallback(
    (newType: "codigo" | "nombre") => {
      setFilterType(newType);
      setResults([]);
    },
    []
  );

  const handleSelectResult = useCallback(
    (item: SearchResultItem) => {
      if (onSelectEntity) {
        const selectedEntity: HighlightedMapEntity = {
          id: item.id || `cf-${item.code}`,
          layerKind: "CODIGOS_FIJOS",
          code: item.code,
          fixedCodeNumber: item.fixedCode ?? item.code,
          name: item.name,
          uv: item.uv || "-",
          mz: item.mz || "-",
          lote: item.lotNumber || item.lote || "No asignado",
          status: item.actionTag,
          statusVal: item.statusVal ?? 1,
          statusColor:
            item.statusVal === 1
              ? "emerald"
              : item.statusVal === 2
              ? "amber"
              : item.statusVal === 3
              ? "rose"
              : item.statusVal === 4
              ? "yellow"
              : "slate",
          lat: item.lat,
          lng: item.lng,
        };
        onSelectEntity(selectedEntity);
      }
    },
    [onSelectEntity]
  );

  const handleViewInFullTable = useCallback(() => {
    const fieldParam = filterType === "codigo" ? "fixed_code" : "name";
    const valParam = encodeURIComponent(query.trim());
    router.push(`/consultar?layer=codigos-fijos&field=${fieldParam}&value=${valParam}`);
  }, [filterType, query, router]);

  return {
    query,
    setQuery,
    filterType,
    setFilterType,
    results,
    setResults,
    isSearching,
    executeSearch,
    handleClear,
    handleFilterTypeChange,
    handleSelectResult,
    handleViewInFullTable,
  };
}
