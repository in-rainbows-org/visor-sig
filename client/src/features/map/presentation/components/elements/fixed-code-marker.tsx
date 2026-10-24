"use client";

import React from "react";
import L from "leaflet";
import { Marker } from "react-leaflet";
import {
  type FixedCodeStatusValue,
  FIXED_CODE_PIN_CONFIGS,
  FIXED_CODE_PIN_DEFAULT_SIZE,
  FIXED_CODE_PIN_DEFAULT_ANCHOR,
  FIXED_CODE_PIN_DEFAULT_TOOLTIP_ANCHOR,
  FIXED_CODE_PIN_DEFAULT_POPUP_ANCHOR,
} from "@/features/map/domain/entities/fixed-code-status.entity";

export type FixedCodeMarkerProps = {
  position: [number, number];
  status?: FixedCodeStatusValue;
  fixedCode?: number;
  label?: string;
};

const iconCache = new Map<FixedCodeStatusValue, L.Icon>();

export function getCachedFixedCodeIcon(statusVal: FixedCodeStatusValue = 1): L.Icon {
  const normalizedVal = (statusVal >= 1 && statusVal <= 5 ? statusVal : 1) as FixedCodeStatusValue;
  const existing = iconCache.get(normalizedVal);
  if (existing) return existing;

  const pinConfig = FIXED_CODE_PIN_CONFIGS[normalizedVal];
  const icon = L.icon({
    iconUrl: pinConfig.imagePath,
    iconSize: FIXED_CODE_PIN_DEFAULT_SIZE,
    iconAnchor: FIXED_CODE_PIN_DEFAULT_ANCHOR,
    tooltipAnchor: FIXED_CODE_PIN_DEFAULT_TOOLTIP_ANCHOR,
    popupAnchor: FIXED_CODE_PIN_DEFAULT_POPUP_ANCHOR,
    className: "fixed-code-pin-3d",
  });

  iconCache.set(normalizedVal, icon);
  return icon;
}

function FixedCodeMarkerComponent({
  position,
  status = 1,
}: FixedCodeMarkerProps) {
  const icon = getCachedFixedCodeIcon(status);

  return <Marker position={position} icon={icon} />;
}

export const FixedCodeMarker = React.memo(FixedCodeMarkerComponent);
