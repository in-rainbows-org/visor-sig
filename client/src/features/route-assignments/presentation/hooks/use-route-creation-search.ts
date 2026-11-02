"use client";

import { useState, useCallback } from "react";
import type { FixedCodeCandidate } from "../../domain/entities/fixed-code-candidate.entity";
import { routeCandidateRepository } from "../../infrastructure/repositories/route-candidate.repository-impl";
import { MOCK_FIXED_CODE_CANDIDATES } from "../data/mock-route-assignments";

export type UseRouteCreationSearchOptions = {
  excludedIds?: string[];
  onAddCandidate?: (candidate: FixedCodeCandidate) => void;
};

export function useRouteCreationSearch(options?: UseRouteCreationSearchOptions) {
  const { excludedIds = [], onAddCandidate: externalOnAdd } = options ?? {};
  const [query, setQuery] = useState("");
  const [candidates, setCandidates] = useState<FixedCodeCandidate[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<FixedCodeCandidate | null>(null);
  const [addedCandidates, setAddedCandidates] = useState<FixedCodeCandidate[]>([]);
  const [isDropdownExpanded, setIsDropdownExpanded] = useState(false);
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);

  const executeSearch = useCallback(async (searchQuery: string) => {
    const clean = searchQuery.replace(/[^0-9]/g, "").trim();
    if (!clean) {
      setCandidates([]);
      return [];
    }

    const num = parseInt(clean, 10);
    if (isNaN(num)) {
      setCandidates([]);
      return [];
    }

    setIsSearching(true);
    try {
      const result = await routeCandidateRepository.searchCodigosFijosForAssignment(num, 15);
      if (result.ok && result.data && result.data.length > 0) {
        // Filtrar inmediatamente los que ya están en el carrito
        const filtered = result.data.filter((c) => !excludedIds.includes(c.id));
        setCandidates(filtered);
        return filtered;
      }

      // Fallback a mock data para navegación fluida y pruebas locales
      const mockFiltered = MOCK_FIXED_CODE_CANDIDATES.filter(
        (c) =>
          (c.fixedCode ? String(c.fixedCode).startsWith(clean) : false) &&
          !excludedIds.includes(c.id)
      );
      setCandidates(mockFiltered);
      return mockFiltered;
    } catch {
      const mockFiltered = MOCK_FIXED_CODE_CANDIDATES.filter(
        (c) =>
          (c.fixedCode ? String(c.fixedCode).startsWith(clean) : false) &&
          !excludedIds.includes(c.id)
      );
      setCandidates(mockFiltered);
      return mockFiltered;
    } finally {
      setIsSearching(false);
    }
  }, [excludedIds]);

  const handleSelectCandidate = useCallback((candidate: FixedCodeCandidate) => {
    setSelectedCandidate(candidate);
    setIsDropdownExpanded(false);
    setIsMobileSheetOpen(false);
  }, []);

  const handleAddCandidate = useCallback((candidate: FixedCodeCandidate) => {
    // 1. Notificar callback externo (Store del Wizard) si existe
    if (externalOnAdd) {
      externalOnAdd(candidate);
    }
    // 2. Mantener en estado local para retrocompatibilidad
    setAddedCandidates((prev) => {
      if (prev.some((c) => c.id === candidate.id)) return prev;
      return [...prev, candidate];
    });
    // 3. Remover inmediatamente de la lista de búsqueda activa
    setCandidates((prev) => prev.filter((c) => c.id !== candidate.id));
  }, [externalOnAdd]);

  const handleRemoveCandidate = useCallback((id: string) => {
    setAddedCandidates((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const handleClear = useCallback(() => {
    setQuery("");
    setCandidates([]);
    setSelectedCandidate(null);
    setIsDropdownExpanded(false);
    setIsMobileSheetOpen(false);
  }, []);

  return {
    query,
    setQuery,
    candidates,
    isSearching,
    selectedCandidate,
    addedCandidates,
    isDropdownExpanded,
    setIsDropdownExpanded,
    isMobileSheetOpen,
    setIsMobileSheetOpen,
    executeSearch,
    handleSelectCandidate,
    handleAddCandidate,
    handleRemoveCandidate,
    handleClear,
  };
}

export default useRouteCreationSearch;
