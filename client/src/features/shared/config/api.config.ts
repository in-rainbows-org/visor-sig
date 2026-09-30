/**
 * Configuración de la URL base para el backend de FastAPI.
 */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/api\/?$/, "") ||
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.API_BASE_URL ||
  "http://localhost:8000";

/**
 * Configuración del proveedor de capas base de tiles cartográficos (Leaflet).
 */
export const MAP_TILE_URL =
  process.env.NEXT_PUBLIC_MAP_TILE_URL ||
  "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

export const MAP_TILE_ATTRIBUTION =
  process.env.NEXT_PUBLIC_MAP_TILE_ATTRIBUTION ||
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

