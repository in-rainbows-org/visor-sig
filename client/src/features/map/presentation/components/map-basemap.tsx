"use client";

import React from "react";
import { TileLayer } from "react-leaflet";
import { MAP_TILE_ATTRIBUTION, MAP_TILE_URL } from "@/features/shared/config/api.config";

export type MapBasemapProps = {
  isVisible: boolean;
};

export function MapBasemap({ isVisible }: MapBasemapProps) {
  if (!isVisible) {
    return null;
  }

  return (
    <TileLayer
      url={MAP_TILE_URL}
      attribution={MAP_TILE_ATTRIBUTION}
      maxZoom={19}
    />
  );
}
