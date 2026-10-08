import type { GeometryType, LayerColor, LayerKind } from "../../../domain/entities/layer.entity";

export type LayerColorConfig = {
  hex: string;
  label: string;
  bgGradient: string;
  cardBg: string;
  badge: string;
  dot: string;
  glow: string;
};

export const LAYER_COLOR_MAP: Record<LayerColor, LayerColorConfig> = {
  BLUE: {
    hex: "#2563eb",
    label: "Azul",
    bgGradient: "from-blue-50/90 via-blue-50/40 to-white",
    cardBg: "hover:border-blue-300/80 hover:shadow-blue-500/5",
    badge: "bg-blue-50 text-blue-700 border-blue-200/80",
    dot: "bg-blue-600",
    glow: "shadow-[0_0_24px_rgba(37,99,235,0.15)]",
  },
  ORANGE: {
    hex: "#ea580c",
    label: "Naranja",
    bgGradient: "from-orange-50/90 via-orange-50/40 to-white",
    cardBg: "hover:border-orange-300/80 hover:shadow-orange-500/5",
    badge: "bg-orange-50 text-orange-700 border-orange-200/80",
    dot: "bg-orange-600",
    glow: "shadow-[0_0_24px_rgba(234,88,12,0.15)]",
  },
  GREEN: {
    hex: "#059669",
    label: "Verde",
    bgGradient: "from-emerald-50/90 via-emerald-50/40 to-white",
    cardBg: "hover:border-emerald-300/80 hover:shadow-emerald-500/5",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
    dot: "bg-emerald-600",
    glow: "shadow-[0_0_24px_rgba(5,150,105,0.15)]",
  },
  VIOLET: {
    hex: "#7c3aed",
    label: "Violeta",
    bgGradient: "from-purple-50/90 via-purple-50/40 to-white",
    cardBg: "hover:border-purple-300/80 hover:shadow-purple-500/5",
    badge: "bg-purple-50 text-purple-700 border-purple-200/80",
    dot: "bg-purple-600",
    glow: "shadow-[0_0_24px_rgba(124,58,237,0.15)]",
  },
  RED: {
    hex: "#dc2626",
    label: "Rojo",
    bgGradient: "from-rose-50/90 via-rose-50/40 to-white",
    cardBg: "hover:border-rose-300/80 hover:shadow-rose-500/5",
    badge: "bg-rose-50 text-rose-700 border-rose-200/80",
    dot: "bg-rose-600",
    glow: "shadow-[0_0_24px_rgba(220,38,38,0.15)]",
  },
  LIGHT_BLUE: {
    hex: "#0284c7",
    label: "Celeste",
    bgGradient: "from-cyan-50/90 via-cyan-50/40 to-white",
    cardBg: "hover:border-cyan-300/80 hover:shadow-cyan-500/5",
    badge: "bg-cyan-50 text-cyan-700 border-cyan-200/80",
    dot: "bg-cyan-600",
    glow: "shadow-[0_0_24px_rgba(2,132,199,0.15)]",
  },
  YELLOW: {
    hex: "#d97706",
    label: "Amarillo",
    bgGradient: "from-amber-50/90 via-amber-50/40 to-white",
    cardBg: "hover:border-amber-300/80 hover:shadow-amber-500/5",
    badge: "bg-amber-50 text-amber-700 border-amber-200/80",
    dot: "bg-amber-600",
    glow: "shadow-[0_0_24px_rgba(217,119,6,0.15)]",
  },
};

export const GEOMETRY_LABEL_MAP: Record<GeometryType, string> = {
  POINT: "Puntos",
  LINE: "Líneas",
  POLYGON: "Polígonos",
};

export const LAYER_DASHBOARD_ASSETS: Record<string, string> = {
  CODIGOS_FIJOS: "/dashboard-icons/codigos.png",
  codigos_fijos: "/dashboard-icons/codigos.png",
  LOTES: "/dashboard-icons/lotes.png",
  lotes: "/dashboard-icons/lotes.png",
  MANZANAS: "/dashboard-icons/manzanas.png",
  manzanas: "/dashboard-icons/manzanas.png",
  VIAS: "/dashboard-icons/vias.png",
  vias: "/dashboard-icons/vias.png",
};

export function getLayerDashboardAsset(layerKind?: string, layerName?: string): string {
  if (layerKind) {
    if (LAYER_DASHBOARD_ASSETS[layerKind]) return LAYER_DASHBOARD_ASSETS[layerKind];
    if (LAYER_DASHBOARD_ASSETS[layerKind.toUpperCase()]) return LAYER_DASHBOARD_ASSETS[layerKind.toUpperCase()];
    if (LAYER_DASHBOARD_ASSETS[layerKind.toLowerCase()]) return LAYER_DASHBOARD_ASSETS[layerKind.toLowerCase()];
  }
  if (layerName) {
    const normalized = layerName.toLowerCase();
    if (normalized.includes("codigo") || normalized.includes("código")) return "/dashboard-icons/codigos.png";
    if (normalized.includes("lote")) return "/dashboard-icons/lotes.png";
    if (normalized.includes("manzana")) return "/dashboard-icons/manzanas.png";
    if (normalized.includes("via") || normalized.includes("vía")) return "/dashboard-icons/vias.png";
  }
  return "/dashboard-icons/codigos.png";
}

export function formatUpdatedDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Reciente";
    return new Intl.DateTimeFormat("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  } catch {
    return "Reciente";
  }
}
