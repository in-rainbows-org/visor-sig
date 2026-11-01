"use client";

import React from "react";
import { TileLayer } from "react-leaflet";
import {
  BASEMAP_PROVIDERS,
  type BasemapProviderId,
} from "../../../domain/entities/basemap.entity";

export type MapBasemapProps = {
  providerId?: BasemapProviderId;
  isVisible?: boolean;
};

export function MapBasemap({
  providerId = "osm",
  isVisible = true,
}: MapBasemapProps) {
  if (!isVisible || providerId === "none") {
    return null;
  }

  const config = BASEMAP_PROVIDERS[providerId];
  if (!config || !config.url) {
    return null;
  }

  return (
    <TileLayer
      key={config.id}
      url={config.url}
      attribution={config.attribution ?? ""}
      maxZoom={config.maxZoom}
      maxNativeZoom={config.maxNativeZoom}
      subdomains={config.subdomains ?? ["a", "b", "c"]}
    />
  );
}
