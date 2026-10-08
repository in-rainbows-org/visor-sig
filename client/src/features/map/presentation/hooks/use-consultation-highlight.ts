"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import type { HighlightedMapEntity } from "../../domain/entities/highlighted-entity.entity";
import { consultationRepositoryImpl } from "@/features/consultations/infrastructure/repositories/consultation.repository-impl";
import { useMapView } from "../state/map-view-store";
import { appToast } from "@/features/shared/presentation/components/notifications/toast";

export interface UseConsultationHighlightResult {
  highlightedEntity: HighlightedMapEntity | null;
  isFromConsultation: boolean;
  isLoading: boolean;
  isInitialLandingWithParam: boolean;
  focusEntityById: (id: string) => Promise<void>;
  clearHighlight: () => void;
}

function getStatusStyling(statusVal: number): { status: string; statusColor: string } {
  switch (statusVal) {
    case 1:
      return { status: "Normal", statusColor: "emerald" };
    case 2:
      return { status: "Para corte", statusColor: "amber" };
    case 3:
      return { status: "Cortado", statusColor: "rose" };
    case 4:
      return { status: "Baja parcial", statusColor: "yellow" };
    case 5:
      return { status: "Baja total", statusColor: "slate" };
    default:
      return { status: `Estado ${statusVal}`, statusColor: "slate" };
  }
}

export function useConsultationHighlight(): UseConsultationHighlightResult {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { setLayerVisibility } = useMapView();

  const fixedCodeIdParam = searchParams.get("fixed_code_id") || searchParams.get("entity_id");
  const isFromConsultation = Boolean(fixedCodeIdParam || searchParams.get("from") === "consultation");

  const [highlightedEntity, setHighlightedEntity] = useState<HighlightedMapEntity | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(fixedCodeIdParam));

  const fetchedIdRef = useRef<string | null>(null);

  const fetchAndFocusEntity = useCallback(
    async (id: string) => {
      setIsLoading(true);
      try {
        const res = await consultationRepositoryImpl.getCodigoFijoById(id);
        if (res.ok) {
          const detail = res.data;

          if (
            typeof detail.latitude !== "number" ||
            typeof detail.longitude !== "number" ||
            isNaN(detail.latitude) ||
            isNaN(detail.longitude)
          ) {
            appToast.warning("El código fijo no posee coordenadas georreferenciadas válidas.");
            setHighlightedEntity(null);
            return;
          }

          const { status, statusColor } = getStatusStyling(detail.status);

          const entity: HighlightedMapEntity = {
            id: detail.id,
            layerKind: "CODIGOS_FIJOS",
            code: String(detail.fixedCode || detail.label || "CF"),
            fixedCodeNumber: detail.fixedCode ?? detail.label ?? "",
            name: detail.name || "Sin titular registrado",
            uv: detail.uv || "-",
            mz: detail.blockNumber || "-",
            lote: detail.lotNumber || "-",
            status,
            statusVal: detail.status,
            statusColor,
            lat: detail.latitude,
            lng: detail.longitude,
          };

          fetchedIdRef.current = id;
          setLayerVisibility("CODIGOS_FIJOS", true);
          setHighlightedEntity(entity);
        } else {
          appToast.error("No encontrado", res.errors?.[0] || "Código fijo no encontrado.");
          setHighlightedEntity(null);
        }
      } catch {
        appToast.error("Error", "No se pudo cargar la información del código fijo.");
        setHighlightedEntity(null);
      } finally {
        setIsLoading(false);
      }
    },
    [setLayerVisibility]
  );

  // Sincronización cuando cambia el query param en la URL
  useEffect(() => {
    if (!fixedCodeIdParam || fetchedIdRef.current === fixedCodeIdParam) {
      return;
    }

    const timer = setTimeout(() => {
      void fetchAndFocusEntity(fixedCodeIdParam);
    }, 0);

    return () => {
      clearTimeout(timer);
    };
  }, [fixedCodeIdParam, fetchAndFocusEntity]);

  const focusEntityById = useCallback(
    async (id: string) => {
      const nextParams = new URLSearchParams(searchParams.toString());
      nextParams.set("fixed_code_id", id);
      const targetUrl = `${pathname}?${nextParams.toString()}`;
      router.replace(targetUrl, { scroll: false });
      await fetchAndFocusEntity(id);
    },
    [pathname, searchParams, router, fetchAndFocusEntity]
  );

  const clearHighlight = useCallback(() => {
    setHighlightedEntity(null);
    fetchedIdRef.current = null;

    const nextParams = new URLSearchParams(searchParams.toString());
    const keysToRemove = [
      "fixed_code_id",
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
    const targetUrl = qs ? `${pathname}?${qs}` : pathname;
    router.replace(targetUrl, { scroll: false });
  }, [pathname, searchParams, router]);

  const activeHighlightedEntity = fixedCodeIdParam ? highlightedEntity : null;
  const isInitialLandingWithParam = Boolean(fixedCodeIdParam && !highlightedEntity && isLoading);

  return {
    highlightedEntity: activeHighlightedEntity,
    isFromConsultation,
    isLoading,
    isInitialLandingWithParam,
    focusEntityById,
    clearHighlight,
  };
}
