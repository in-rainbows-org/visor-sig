"use client";

import React, { useEffect, useRef, useMemo } from "react";
import L from "leaflet";
import { Marker, Popup, useMap } from "react-leaflet";
import type { HighlightedMapEntity } from "@/features/map/domain/entities/highlighted-entity.entity";
import {
  FIXED_CODE_STATUSES,
  type FixedCodeStatusValue,
} from "@/features/map/domain/entities/fixed-code-status.entity";
import { getCachedFixedCodeIcon } from "./fixed-code-marker";

export interface HighlightedConsultationMarkerProps {
  entity: HighlightedMapEntity;
  onClose?: () => void;
}

function getStatusStyling(statusVal: number) {
  const normalizedVal = (statusVal >= 1 && statusVal <= 5 ? statusVal : 1) as FixedCodeStatusValue;
  const config = FIXED_CODE_STATUSES[normalizedVal] || FIXED_CODE_STATUSES[1];

  switch (normalizedVal) {
    case 1: // Normal
      return {
        dotClass: "bg-emerald-500",
        badgeClass: "bg-emerald-50 text-emerald-700",
        label: config.label,
      };
    case 2: // Para corte
      return {
        dotClass: "bg-amber-500",
        badgeClass: "bg-amber-50 text-amber-700",
        label: config.label,
      };
    case 3: // Cortado
      return {
        dotClass: "bg-rose-500",
        badgeClass: "bg-rose-50 text-rose-700",
        label: config.label,
      };
    case 4: // Baja parcial
      return {
        dotClass: "bg-yellow-600",
        badgeClass: "bg-yellow-50 text-yellow-800",
        label: config.label,
      };
    case 5: // Baja total
      return {
        dotClass: "bg-slate-600",
        badgeClass: "bg-slate-100 text-slate-700",
        label: config.label,
      };
    default:
      return {
        dotClass: "bg-emerald-500",
        badgeClass: "bg-emerald-50 text-emerald-700",
        label: "Normal",
      };
  }
}

export function HighlightedConsultationMarker({
  entity,
  onClose,
}: HighlightedConsultationMarkerProps) {
  const map = useMap();
  const markerRef = useRef<L.Marker | null>(null);

  const styling = useMemo(() => getStatusStyling(entity.statusVal), [entity.statusVal]);

  // Usar el pin WebP 3D correspondiente al estado del código fijo seleccionado
  const icon = useMemo(() => {
    return getCachedFixedCodeIcon((entity.statusVal ?? 1) as FixedCodeStatusValue);
  }, [entity.statusVal]);

  // Centrado hacia el punto y apertura automática del globo de información
  useEffect(() => {
    if (isNaN(entity.lat) || isNaN(entity.lng)) return;

    let cancelled = false;
    let popupTimerId: NodeJS.Timeout | null = null;

    const doZoomAndFocus = () => {
      if (cancelled) return;

      map.invalidateSize({ pan: false });
      map.setView([entity.lat, entity.lng], 18, { animate: false });

      popupTimerId = setTimeout(() => {
        if (!cancelled && markerRef.current) {
          markerRef.current.openPopup();
        }
      }, 150);
    };

    const timer = setTimeout(doZoomAndFocus, 60);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      if (popupTimerId) clearTimeout(popupTimerId);
    };
  }, [map, entity.id, entity.lat, entity.lng]);

  if (isNaN(entity.lat) || isNaN(entity.lng)) {
    return null;
  }

  const displayCode = entity.fixedCodeNumber || entity.code;
  const displayName = entity.name || "Predio Registrado";
  const displayStatus = entity.status || styling.label;

  return (
    <Marker
      ref={markerRef}
      position={[entity.lat, entity.lng]}
      icon={icon}
      eventHandlers={{
        popupclose: () => {
          onClose?.();
        },
      }}
    >
      <Popup
        autoClose={false}
        closeOnClick={false}
        autoPan={true}
        autoPanPadding={[24, 24]}
        offset={[0, -2]}
        className="consultation-speech-bubble-popup"
      >
        <div className="w-56 p-1 text-slate-800 font-sans select-none flex flex-col items-center text-center">
          {/* 1. Header: Código Fijo en azul con punto indicador centrado */}
          <div className="flex items-center justify-center gap-1.5 text-[10px] font-bold text-blue-600 tracking-wider uppercase">
            <span>Código Fijo</span>
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse inline-block shrink-0" />
          </div>

          {/* 2. Número del Código Fijo en tamaño resaltado y centrado */}
          <div className="text-2xl font-black text-slate-900 leading-tight mt-0.5 tracking-tight">
            {displayCode}
          </div>

          {/* 3. Nombre del titular o predio centrado */}
          <div className="mt-0.5 text-[11px] font-medium text-slate-500 leading-tight truncate max-w-[210px] px-1">
            {displayName}
          </div>

          {/* 4. UV - MZA - LOTE: card plana de color gris, sin contorno ni sombra */}
          <div className="w-full flex items-center justify-around bg-slate-100/90 rounded-xl px-2.5 py-2 mt-2.5 text-[11px] font-semibold text-slate-700 shadow-none border-0">
            <div className="flex flex-col items-center">
              <span className="text-slate-400 font-normal text-[9px] uppercase tracking-wider">UV</span>
              <span className="text-slate-900 font-bold">{entity.uv || "-"}</span>
            </div>
            <div className="h-4 w-px bg-slate-200/80" />
            <div className="flex flex-col items-center">
              <span className="text-slate-400 font-normal text-[9px] uppercase tracking-wider">MZA</span>
              <span className="text-slate-900 font-bold">{entity.mz || "-"}</span>
            </div>
            <div className="h-4 w-px bg-slate-200/80" />
            <div className="flex flex-col items-center">
              <span className="text-slate-400 font-normal text-[9px] uppercase tracking-wider">LOTE</span>
              <span className="text-slate-900 font-bold">{entity.lote || "-"}</span>
            </div>
          </div>

          {/* 5. Estado: badge plano centrado sin contorno ni sombra */}
          <div className="mt-2.5 flex justify-center">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold shadow-none border-0 ${styling.badgeClass}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${styling.dotClass}`} />
              <span>{displayStatus}</span>
            </span>
          </div>
        </div>
      </Popup>
    </Marker>
  );
}

export default HighlightedConsultationMarker;
