"use client";

import React from "react";
import L from "leaflet";
import { Marker, Tooltip } from "react-leaflet";
import {
  FIXED_CODE_STATUSES,
  type FixedCodeStatusValue,
} from "../../domain/models/fixed-code-status.types";

export type FixedCodeMarkerProps = {
  position: [number, number];
  status?: FixedCodeStatusValue;
  fixedCode?: number;
  label?: string;
};

function getGlyphSvg(glyph: string): string {
  switch (glyph) {
    case "droplet":
      return `<path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" fill="currentColor"/>`;
    case "alert":
      return `<path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`;
    case "x":
      return `<path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`;
    case "minus":
      return `<path d="M5 12h14" stroke="currentColor" stroke-width="3" stroke-linecap="round" fill="none"/>`;
    case "slash":
      return `<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2" fill="none"/><path d="M4.93 4.93l14.14 14.14" stroke="currentColor" stroke-width="2"/>`;
    default:
      return `<circle cx="12" cy="12" r="4" fill="currentColor"/>`;
  }
}

function createFixedCodeDivIcon(statusVal: FixedCodeStatusValue = 1): L.DivIcon {
  const config = FIXED_CODE_STATUSES[statusVal] ?? FIXED_CODE_STATUSES[1];
  const glyphSvg = getGlyphSvg(config.glyph);

  const html = `
    <div class="relative flex items-center justify-center w-6 h-6 group cursor-pointer">
      <div class="w-6 h-6 rounded-full ${config.pinBgClass} border-2 border-white shadow-md flex items-center justify-center transition-transform group-hover:scale-125">
        <svg class="w-3.5 h-3.5 ${config.pinTextClass}" viewBox="0 0 24 24" fill="none">
          ${glyphSvg}
        </svg>
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: "custom-fixed-code-pin",
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

const iconCache = new Map<FixedCodeStatusValue, L.DivIcon>();

export function getCachedFixedCodeIcon(statusVal: FixedCodeStatusValue = 1): L.DivIcon {
  const existing = iconCache.get(statusVal);
  if (existing) return existing;
  const created = createFixedCodeDivIcon(statusVal);
  iconCache.set(statusVal, created);
  return created;
}

function FixedCodeMarkerComponent({
  position,
  status = 1,
  fixedCode,
  label,
}: FixedCodeMarkerProps) {
  const icon = getCachedFixedCodeIcon(status);
  const displayText = label || (fixedCode !== undefined ? `Código ${fixedCode}` : undefined);

  return (
    <Marker position={position} icon={icon}>
      {displayText ? (
        <Tooltip direction="top" offset={[0, -10]}>
          {displayText}
        </Tooltip>
      ) : null}
    </Marker>
  );
}

export const FixedCodeMarker = React.memo(FixedCodeMarkerComponent);
