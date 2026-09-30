/**
 * Catálogo de estados de Códigos Fijos según el modelo de datos PostGIS (1 a 5).
 */
export type FixedCodeStatusValue = 1 | 2 | 3 | 4 | 5;

export type FixedCodeStatusDefinition = {
  value: FixedCodeStatusValue;
  key: "normal" | "para_corte" | "cortado" | "baja_parcial" | "baja_total";
  label: string;
  badgeLabel: string;
  colorName: string;
  pinBgClass: string;
  pinBorderClass: string;
  pinTextClass: string;
  badgeBgClass: string;
  glyph: "droplet" | "alert" | "x" | "minus" | "slash";
};

export const FIXED_CODE_STATUSES: Record<FixedCodeStatusValue, FixedCodeStatusDefinition> = {
  1: {
    value: 1,
    key: "normal",
    label: "Normal",
    badgeLabel: "Normal",
    colorName: "Verde",
    pinBgClass: "bg-emerald-500",
    pinBorderClass: "border-emerald-600",
    pinTextClass: "text-white",
    badgeBgClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
    glyph: "droplet",
  },
  2: {
    value: 2,
    key: "para_corte",
    label: "Para corte",
    badgeLabel: "Para corte",
    colorName: "Naranja",
    pinBgClass: "bg-amber-500",
    pinBorderClass: "border-amber-600",
    pinTextClass: "text-white",
    badgeBgClass: "bg-amber-50 text-amber-700 border-amber-200",
    glyph: "alert",
  },
  3: {
    value: 3,
    key: "cortado",
    label: "Cortado",
    badgeLabel: "Cortado",
    colorName: "Rojo",
    pinBgClass: "bg-rose-500",
    pinBorderClass: "border-rose-600",
    pinTextClass: "text-white",
    badgeBgClass: "bg-rose-50 text-rose-700 border-rose-200",
    glyph: "x",
  },
  4: {
    value: 4,
    key: "baja_parcial",
    label: "Baja parcial",
    badgeLabel: "Baja parcial",
    colorName: "Ocre",
    pinBgClass: "bg-yellow-600",
    pinBorderClass: "border-yellow-700",
    pinTextClass: "text-white",
    badgeBgClass: "bg-yellow-50 text-yellow-800 border-yellow-200",
    glyph: "minus",
  },
  5: {
    value: 5,
    key: "baja_total",
    label: "Baja total",
    badgeLabel: "Baja total",
    colorName: "Gris",
    pinBgClass: "bg-slate-600",
    pinBorderClass: "border-slate-700",
    pinTextClass: "text-white",
    badgeBgClass: "bg-slate-100 text-slate-700 border-slate-300",
    glyph: "slash",
  },
};

export const ALL_FIXED_CODE_STATUS_VALUES: FixedCodeStatusValue[] = [1, 2, 3, 4, 5];
