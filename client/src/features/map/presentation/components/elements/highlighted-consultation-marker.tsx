"use client";

import React, { useEffect, useRef, useMemo } from "react";
import L from "leaflet";
import { Marker, Popup, useMap } from "react-leaflet";
import { HighlightedMapEntity } from "../../../domain/models/highlighted-entity.types";
import { FIXED_CODE_STATUSES, FixedCodeStatusValue } from "../../../domain/models/fixed-code-status.types";

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
        badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
        pinBg: "bg-emerald-500",
        pingBg: "bg-emerald-400",
        ringClass: "ring-emerald-400",
        label: config.label,
      };
    case 2: // Para corte
      return {
        dotClass: "bg-amber-500",
        badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
        pinBg: "bg-amber-500",
        pingBg: "bg-amber-400",
        ringClass: "ring-amber-400",
        label: config.label,
      };
    case 3: // Cortado
      return {
        dotClass: "bg-rose-500",
        badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
        pinBg: "bg-rose-500",
        pingBg: "bg-rose-400",
        ringClass: "ring-rose-400",
        label: config.label,
      };
    case 4: // Baja parcial
      return {
        dotClass: "bg-yellow-600",
        badgeClass: "bg-yellow-50 text-yellow-800 border-yellow-200",
        pinBg: "bg-yellow-600",
        pingBg: "bg-yellow-400",
        ringClass: "ring-yellow-400",
        label: config.label,
      };
    case 5: // Baja total
      return {
        dotClass: "bg-slate-600",
        badgeClass: "bg-slate-100 text-slate-700 border-slate-300",
        pinBg: "bg-slate-600",
        pingBg: "bg-slate-400",
        ringClass: "ring-slate-400",
        label: config.label,
      };
    default:
      return {
        dotClass: "bg-emerald-500",
        badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
        pinBg: "bg-emerald-500",
        pingBg: "bg-emerald-400",
        ringClass: "ring-emerald-400",
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

  // Crear icono visual resaltado de punto con animación de pulso y color del estado
  const customIcon = useMemo(() => {
    const html = `
      <div class="relative flex items-center justify-center w-8 h-8 pointer-events-auto cursor-pointer">
        <span class="animate-ping absolute inline-flex h-7 w-7 rounded-full ${styling.pingBg} opacity-60"></span>
        <div class="relative w-7 h-7 rounded-full ${styling.pinBg} border-2 border-white shadow-lg flex items-center justify-center ring-2 ${styling.ringClass}/40">
          <div class="w-2.5 h-2.5 rounded-full bg-white shadow-xs"></div>
        </div>
      </div>
    `;

    return L.divIcon({
      html,
      className: "highlighted-consultation-pin",
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -18],
    });
  }, [styling]);

  // Centrado flyTo suave hacia el punto y apertura automática del globo de información
  useEffect(() => {
    const currentZoom = map.getZoom();
    const targetZoom = currentZoom < 16 ? 17 : currentZoom;
    map.flyTo([entity.lat, entity.lng], targetZoom, {
      animate: true,
      duration: 0.8,
    });

    const timer = setTimeout(() => {
      if (markerRef.current) {
        markerRef.current.openPopup();
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [map, entity.id, entity.lat, entity.lng, entity.code]);

  const displayCode = entity.fixedCodeNumber || entity.code;
  const displayName = entity.name || "Predio Registrado";
  const displayStatus = entity.status || styling.label;

  return (
    <Marker
      ref={markerRef}
      position={[entity.lat, entity.lng]}
      icon={customIcon}
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
        className="consultation-speech-bubble-popup"
      >
        <div className="w-56 p-1 text-slate-800 font-sans select-none">
          {/* 1. Header: Código Fijo marcado en Color Azul con punto inmediatamente pegado */}
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-blue-600 tracking-wider uppercase">
            <span>Código Fijo</span>
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse inline-block shrink-0"></span>
          </div>

          {/* 2. Número del Código Fijo en tamaño resaltado */}
          <div className="text-xl font-extrabold text-slate-900 leading-tight mt-0.5 tracking-tight">
            {displayCode}
          </div>

          {/* 3. Nombre del titular/predio con apartado 'Nombre:' en tamaño reducido */}
          <div className="mt-1 pt-1 border-t border-slate-100 flex items-start gap-1">
            <span className="text-[10px] font-semibold text-slate-400 shrink-0">Nombre:</span>
            <span className="text-[11px] font-medium text-slate-600 leading-tight break-words">
              {displayName}
            </span>
          </div>

          {/* 4. UV - MZA - LOTE alineados en una sola fila con separación exacta */}
          <div className="flex items-center justify-between bg-slate-50/90 border border-slate-200/80 rounded-lg px-2.5 py-1.5 mt-2 text-[11px] font-semibold text-slate-700 shadow-2xs">
            <span className="flex items-center gap-1">
              <span className="text-slate-400 font-normal text-[10px]">UV:</span>
              <span className="text-slate-900">{entity.uv || "14"}</span>
            </span>
            <span className="text-slate-300 font-light">•</span>
            <span className="flex items-center gap-1">
              <span className="text-slate-400 font-normal text-[10px]">MZA:</span>
              <span className="text-slate-900">{entity.mz || "08"}</span>
            </span>
            <span className="text-slate-300 font-light">•</span>
            <span className="flex items-center gap-1">
              <span className="text-slate-400 font-normal text-[10px]">LOTE:</span>
              <span className="text-slate-900">{entity.lote || "12"}</span>
            </span>
          </div>

          {/* 5. Estado alineado a un ladito con el punto al lado derecho */}
          <div className="flex items-center gap-1.5 mt-2 pt-1.5 border-t border-slate-100 text-[11px]">
            <span className="text-slate-400 font-medium">Estado:</span>
            <span className="font-bold text-slate-800">
              {displayStatus}
            </span>
            <span className={`w-2 h-2 rounded-full inline-block shrink-0 ${styling.dotClass}`} />
          </div>
        </div>
      </Popup>
    </Marker>
  );
}

export default HighlightedConsultationMarker;
