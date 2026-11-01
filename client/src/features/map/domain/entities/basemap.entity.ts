export type BasemapProviderId =
  | "osm"
  | "opentopo"
  | "satellite"
  | "none";

export interface BasemapProviderConfig {
  id: BasemapProviderId;
  name: string;
  url: string | null;
  attribution: string | null;
  maxZoom: number;
  maxNativeZoom: number;
  subdomains?: string[];
}

export const BASEMAP_PROVIDERS: Record<BasemapProviderId, BasemapProviderConfig> = {
  osm: {
    id: "osm",
    name: "Estándar",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
    maxNativeZoom: 19,
    subdomains: ["a", "b", "c"],
  },
  opentopo: {
    id: "opentopo",
    name: "Topográfico",
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    attribution:
      'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)',
    maxZoom: 17,
    maxNativeZoom: 17,
    subdomains: ["a", "b", "c"],
  },
  satellite: {
    id: "satellite",
    name: "Satelital",
    url: "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution:
      'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    maxZoom: 19,
    maxNativeZoom: 18,
  },
  none: {
    id: "none",
    name: "Sin fondo",
    url: null,
    attribution: null,
    maxZoom: 20,
    maxNativeZoom: 19,
  },
};

export const DEFAULT_BASEMAP_ID: BasemapProviderId = "osm";
