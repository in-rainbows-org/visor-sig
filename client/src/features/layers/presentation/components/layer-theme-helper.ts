import type { GeometryType, LayerColor } from "../../domain/entities/layer.entity";

export type LayerColorConfig = {
  hex: string;
  label: string;
  bgGradient: string;
  iconBox: string;
  badge: string;
  dot: string;
  activeBadge: string;
};

export const LAYER_COLOR_MAP: Record<LayerColor, LayerColorConfig> = {
  BLUE: {
    hex: "#2563eb",
    label: "Azul",
    bgGradient: "from-blue-100/90 via-blue-50/70 to-blue-50/20 border-blue-200/90",
    iconBox: "bg-blue-50 text-blue-600 border-blue-200 shadow-xs",
    badge: "bg-blue-100/90 text-blue-800 border-blue-300 font-semibold",
    dot: "bg-blue-600",
    activeBadge: "bg-blue-100 text-blue-800 border-blue-300 font-semibold",
  },
  ORANGE: {
    hex: "#ea580c",
    label: "Naranja",
    bgGradient: "from-orange-100/90 via-orange-50/70 to-orange-50/20 border-orange-200/90",
    iconBox: "bg-orange-50 text-orange-600 border-orange-200 shadow-xs",
    badge: "bg-orange-100/90 text-orange-800 border-orange-300 font-semibold",
    dot: "bg-orange-600",
    activeBadge: "bg-orange-100 text-orange-800 border-orange-300 font-semibold",
  },
  GREEN: {
    hex: "#059669",
    label: "Verde",
    bgGradient: "from-emerald-100/90 via-emerald-50/70 to-emerald-50/20 border-emerald-200/90",
    iconBox: "bg-emerald-50 text-emerald-600 border-emerald-200 shadow-xs",
    badge: "bg-emerald-100/90 text-emerald-800 border-emerald-300 font-semibold",
    dot: "bg-emerald-600",
    activeBadge: "bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold",
  },
  VIOLET: {
    hex: "#7c3aed",
    label: "Violeta",
    bgGradient: "from-purple-100/90 via-purple-50/70 to-purple-50/20 border-purple-200/90",
    iconBox: "bg-purple-50 text-purple-600 border-purple-200 shadow-xs",
    badge: "bg-purple-100/90 text-purple-800 border-purple-300 font-semibold",
    dot: "bg-purple-600",
    activeBadge: "bg-purple-100 text-purple-800 border-purple-300 font-semibold",
  },
  RED: {
    hex: "#dc2626",
    label: "Rojo",
    bgGradient: "from-rose-100/90 via-rose-50/70 to-rose-50/20 border-rose-200/90",
    iconBox: "bg-rose-50 text-rose-600 border-rose-200 shadow-xs",
    badge: "bg-rose-100/90 text-rose-800 border-rose-300 font-semibold",
    dot: "bg-rose-600",
    activeBadge: "bg-rose-100 text-rose-800 border-rose-300 font-semibold",
  },
  LIGHT_BLUE: {
    hex: "#0284c7",
    label: "Celeste",
    bgGradient: "from-cyan-100/90 via-cyan-50/70 to-cyan-50/20 border-cyan-200/90",
    iconBox: "bg-cyan-50 text-cyan-600 border-cyan-200 shadow-xs",
    badge: "bg-cyan-100/90 text-cyan-800 border-cyan-300 font-semibold",
    dot: "bg-cyan-600",
    activeBadge: "bg-cyan-100 text-cyan-800 border-cyan-300 font-semibold",
  },
  YELLOW: {
    hex: "#d97706",
    label: "Amarillo",
    bgGradient: "from-amber-100/90 via-amber-50/70 to-amber-50/20 border-amber-200/90",
    iconBox: "bg-amber-50 text-amber-600 border-amber-200 shadow-xs",
    badge: "bg-amber-100/90 text-amber-800 border-amber-300 font-semibold",
    dot: "bg-amber-600",
    activeBadge: "bg-amber-100 text-amber-800 border-amber-300 font-semibold",
  },
};

export const GEOMETRY_LABEL_MAP: Record<GeometryType, string> = {
  POINT: "Puntos",
  LINE: "Líneas",
  POLYGON: "Polígonos",
};

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
