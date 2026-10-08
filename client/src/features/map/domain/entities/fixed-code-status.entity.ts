/**
 * Catálogo de estados de Códigos Fijos según el modelo de datos PostGIS (1 a 5).
 * Capa de dominio pura: no contiene clases visuales ni dependencias de frameworks.
 */
export type FixedCodeStatusValue = 1 | 2 | 3 | 4 | 5;

export type FixedCodeStatusKey =
  | "normal"
  | "para_corte"
  | "cortado"
  | "baja_parcial"
  | "baja_total";

export type FixedCodeGlyph = "droplet" | "alert" | "x" | "minus" | "slash";

export type FixedCodeStatusDefinition = {
  value: FixedCodeStatusValue;
  key: FixedCodeStatusKey;
  label: string;
  badgeLabel: string;
  colorName: string;
  glyph: FixedCodeGlyph;
};

export const FIXED_CODE_STATUSES: Record<FixedCodeStatusValue, FixedCodeStatusDefinition> = {
  1: {
    value: 1,
    key: "normal",
    label: "Normal",
    badgeLabel: "Normal",
    colorName: "Verde",
    glyph: "droplet",
  },
  2: {
    value: 2,
    key: "para_corte",
    label: "Para corte",
    badgeLabel: "Para corte",
    colorName: "Naranja",
    glyph: "alert",
  },
  3: {
    value: 3,
    key: "cortado",
    label: "Cortado",
    badgeLabel: "Cortado",
    colorName: "Rojo",
    glyph: "x",
  },
  4: {
    value: 4,
    key: "baja_parcial",
    label: "Baja parcial",
    badgeLabel: "Baja parcial",
    colorName: "Ocre",
    glyph: "minus",
  },
  5: {
    value: 5,
    key: "baja_total",
    label: "Baja total",
    badgeLabel: "Baja total",
    colorName: "Gris",
    glyph: "slash",
  },
};

export const ALL_FIXED_CODE_STATUS_VALUES: FixedCodeStatusValue[] = [1, 2, 3, 4, 5];
