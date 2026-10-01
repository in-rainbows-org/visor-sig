"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { HighlightedMapEntity } from "../../domain/models/highlighted-entity.types";

export interface UseConsultationHighlightResult {
  highlightedEntity: HighlightedMapEntity | null;
  isFromConsultation: boolean;
  clearHighlight: () => void;
}

export function useConsultationHighlight(): UseConsultationHighlightResult {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [highlightedEntity, setHighlightedEntity] = useState<HighlightedMapEntity | null>(null);

  const isFromConsultation = searchParams.get("from") === "consultation";

  // Parse highlighted entity from search parameters
  const parsedEntity = useMemo((): HighlightedMapEntity | null => {
    if (!isFromConsultation) return null;

    const latStr = searchParams.get("lat");
    const lngStr = searchParams.get("lng");
    const lat = latStr ? parseFloat(latStr) : -21.5355;
    const lng = lngStr ? parseFloat(lngStr) : -64.7296;

    if (isNaN(lat) || isNaN(lng)) return null;

    const code = searchParams.get("code") || "";
    const fixedCodeNum = searchParams.get("fixed_code_num") || code;
    const name = searchParams.get("name") || "Predio Registrado";
    const uv = searchParams.get("uv") || "14";
    const mz = searchParams.get("mz") || "08";
    const lote = searchParams.get("lote") || "12";
    const status = searchParams.get("status") || "Normal";
    const statusVal = Number(searchParams.get("status_val")) || 1;
    const statusColor = searchParams.get("status_color") || "emerald";

    return {
      id: searchParams.get("entity_id") || "highlighted-from-consultation",
      layerKind: searchParams.get("layer") || "CODIGOS_FIJOS",
      code,
      fixedCodeNumber: fixedCodeNum,
      name,
      uv,
      mz,
      lote,
      status,
      statusVal,
      statusColor,
      lat,
      lng,
    };
  }, [searchParams, isFromConsultation]);

  useEffect(() => {
    if (parsedEntity) {
      setHighlightedEntity(parsedEntity);
    }
  }, [parsedEntity]);

  const clearHighlight = useCallback(() => {
    setHighlightedEntity(null);
    const nextParams = new URLSearchParams(searchParams.toString());
    const keysToRemove = [
      "from",
      "layer",
      "entity_id",
      "code",
      "fixed_code_num",
      "name",
      "uv",
      "mz",
      "lote",
      "status",
      "status_val",
      "status_color",
      "lat",
      "lng",
    ];
    keysToRemove.forEach((k) => nextParams.delete(k));
    const qs = nextParams.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  return {
    highlightedEntity,
    isFromConsultation,
    clearHighlight,
  };
}
