"use client";

import { useCallback, useEffect, useState } from "react";
import {
  LayerOption,
  PaginatedConsultationResponse,
} from "../../domain/models/consultation";
import {
  fetchConsultationLayers,
  searchConsultationEntities,
} from "../../infrastructure/api/consultation-api";

export function useConsultation() {
  const [layers, setLayers] = useState<LayerOption[]>([]);
  const [selectedLayerKind, setSelectedLayerKind] = useState<string>("");
  const [selectedField, setSelectedField] = useState<string>("");
  const [searchValue, setSearchValue] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);

  const [isLoadingLayers, setIsLoadingLayers] = useState<boolean>(true);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [results, setResults] = useState<PaginatedConsultationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Carga inicial de capas disponibles
  useEffect(() => {
    let isMounted = true;
    async function loadLayers() {
      setIsLoadingLayers(true);
      setError(null);
      const res = await fetchConsultationLayers();
      if (!isMounted) return;

      if (res.ok && res.data.length > 0) {
        setLayers(res.data);
        // Seleccionar por defecto la primera capa activa o la primera disponible
        const defaultLayer = res.data.find((l) => l.hasActiveVersion) || res.data[0];
        setSelectedLayerKind(defaultLayer.kind);
        if (defaultLayer.fields.length > 0) {
          setSelectedField(defaultLayer.fields[0].key);
        }
      } else if (!res.ok) {
        setError(res.errors?.[0] || "No se pudieron cargar las capas.");
      }
      setIsLoadingLayers(false);
    }

    loadLayers();
    return () => {
      isMounted = false;
    };
  }, []);

  // Al cambiar la capa seleccionada, actualizar el campo por defecto
  const handleLayerChange = useCallback(
    (newKind: string) => {
      setSelectedLayerKind(newKind);
      const layer = layers.find((l) => l.kind === newKind);
      if (layer && layer.fields.length > 0) {
        setSelectedField(layer.fields[0].key);
      } else {
        setSelectedField("");
      }
    },
    [layers]
  );

  // Ejecución de la búsqueda
  const executeSearch = useCallback(
    async (pageToLoad: number = 1) => {
      if (!selectedLayerKind) return;

      setIsSearching(true);
      setError(null);

      const res = await searchConsultationEntities({
        layerKind: selectedLayerKind,
        field: selectedField || undefined,
        value: searchValue.trim() || undefined,
        page: pageToLoad,
        pageSize: 10,
      });

      if (res.ok) {
        setResults(res.data);
        setCurrentPage(res.data.page);
      } else {
        setError(res.errors?.[0] || "Ocurrió un error al realizar la consulta.");
        setResults(null);
      }
      setIsSearching(false);
    },
    [selectedLayerKind, selectedField, searchValue]
  );

  // Búsqueda inicial automática cuando las capas estén listas
  useEffect(() => {
    if (selectedLayerKind && !results && !isSearching && !isLoadingLayers) {
      executeSearch(1);
    }
  }, [selectedLayerKind, isLoadingLayers]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cambio de página
  const handlePageChange = useCallback(
    (page: number) => {
      if (page === currentPage || page < 1 || (results && page > results.totalPages)) {
        return;
      }
      executeSearch(page);
    },
    [currentPage, results, executeSearch]
  );

  // Reiniciar filtros
  const handleReset = useCallback(() => {
    setSearchValue("");
    if (layers.length > 0) {
      const defaultLayer = layers.find((l) => l.hasActiveVersion) || layers[0];
      setSelectedLayerKind(defaultLayer.kind);
      if (defaultLayer.fields.length > 0) {
        setSelectedField(defaultLayer.fields[0].key);
      }
    }
    setCurrentPage(1);
    setResults(null);
    setError(null);
  }, [layers]);

  const currentLayer = layers.find((l) => l.kind === selectedLayerKind);
  const currentFields = currentLayer?.fields || [];

  return {
    layers,
    currentLayer,
    currentFields,
    selectedLayerKind,
    selectedField,
    searchValue,
    currentPage,
    isLoadingLayers,
    isSearching,
    results,
    error,
    setSelectedLayerKind: handleLayerChange,
    setSelectedField,
    setSearchValue,
    handleSearch: () => executeSearch(1),
    handlePageChange,
    handleReset,
  };
}
