import type { GeometryType, LayerColor } from "../../../domain/entities/layer.entity";

export type LayerColorConfig = {
  hex: string;
  label: string;
  bgGradient: string;
  cardBadge: string;
  badge: string;
  dot: string;
  glow: string;
  cardBg?: string;
};

export const LAYER_COLOR_MAP: Record<LayerColor, LayerColorConfig> = {
  BLUE: {
    hex: "#1b64ea",
    label: "Azul",
    bgGradient: "from-[#2879f7] via-[#1b64ea] to-[#0d4ec8]",
    cardBadge: "bg-white/95 text-[#0d4ec8]",
    badge: "bg-blue-50 text-blue-700 border-blue-200/80",
    dot: "bg-blue-600",
    glow: "shadow-[0_0_24px_rgba(27,100,234,0.3)]",
  },
  ORANGE: {
    hex: "#f97316",
    label: "Naranja",
    bgGradient: "from-[#fb923c] via-[#f97316] to-[#c2410c]",
    cardBadge: "bg-white/95 text-[#c2410c]",
    badge: "bg-orange-50 text-orange-700 border-orange-200/80",
    dot: "bg-orange-600",
    glow: "shadow-[0_0_24px_rgba(249,115,22,0.3)]",
  },
  GREEN: {
    hex: "#0ea868",
    label: "Verde",
    bgGradient: "from-[#16c784] via-[#0ea868] to-[#087f4c]",
    cardBadge: "bg-white/95 text-[#087f4c]",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
    dot: "bg-emerald-600",
    glow: "shadow-[0_0_24px_rgba(14,168,104,0.3)]",
  },
  VIOLET: {
    hex: "#853cf2",
    label: "Violeta",
    bgGradient: "from-[#9f5bff] via-[#853cf2] to-[#671fcf]",
    cardBadge: "bg-white/95 text-[#671fcf]",
    badge: "bg-purple-50 text-purple-700 border-purple-200/80",
    dot: "bg-purple-600",
    glow: "shadow-[0_0_24px_rgba(133,60,242,0.3)]",
  },
  RED: {
    hex: "#ef4444",
    label: "Rojo",
    bgGradient: "from-[#f87171] via-[#ef4444] to-[#b91c1c]",
    cardBadge: "bg-white/95 text-[#b91c1c]",
    badge: "bg-rose-50 text-rose-700 border-rose-200/80",
    dot: "bg-rose-600",
    glow: "shadow-[0_0_24px_rgba(239,68,68,0.3)]",
  },
  LIGHT_BLUE: {
    hex: "#029fe3",
    label: "Celeste",
    bgGradient: "from-[#00c0f8] via-[#029fe3] to-[#0177cb]",
    cardBadge: "bg-white/95 text-[#0177cb]",
    badge: "bg-cyan-50 text-cyan-700 border-cyan-200/80",
    dot: "bg-cyan-600",
    glow: "shadow-[0_0_24px_rgba(2,159,227,0.3)]",
  },
  YELLOW: {
    hex: "#f59e0b",
    label: "Amarillo",
    bgGradient: "from-[#fbbf24] via-[#f59e0b] to-[#b45309]",
    cardBadge: "bg-white/95 text-[#b45309]",
    badge: "bg-amber-50 text-amber-700 border-amber-200/80",
    dot: "bg-amber-600",
    glow: "shadow-[0_0_24px_rgba(245,158,11,0.3)]",
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
