import type { FixedCodeStatusValue } from "@/features/map/domain/entities/fixed-code-status.entity";

export type FixedCodeThemeConfig = {
  pinBgClass: string;
  pinBorderClass: string;
  pinTextClass: string;
  badgeBgClass: string;
  glyph: "droplet" | "alert" | "x" | "minus" | "slash";
};

export const FIXED_CODE_THEME_MAP: Record<FixedCodeStatusValue, FixedCodeThemeConfig> = {
  1: {
    pinBgClass: "bg-emerald-500",
    pinBorderClass: "border-emerald-600",
    pinTextClass: "text-white",
    badgeBgClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
    glyph: "droplet",
  },
  2: {
    pinBgClass: "bg-amber-500",
    pinBorderClass: "border-amber-600",
    pinTextClass: "text-white",
    badgeBgClass: "bg-amber-50 text-amber-700 border-amber-200",
    glyph: "alert",
  },
  3: {
    pinBgClass: "bg-rose-500",
    pinBorderClass: "border-rose-600",
    pinTextClass: "text-white",
    badgeBgClass: "bg-rose-50 text-rose-700 border-rose-200",
    glyph: "x",
  },
  4: {
    pinBgClass: "bg-yellow-600",
    pinBorderClass: "border-yellow-700",
    pinTextClass: "text-white",
    badgeBgClass: "bg-yellow-50 text-yellow-800 border-yellow-200",
    glyph: "minus",
  },
  5: {
    pinBgClass: "bg-slate-600",
    pinBorderClass: "border-slate-700",
    pinTextClass: "text-white",
    badgeBgClass: "bg-slate-100 text-slate-700 border-slate-300",
    glyph: "slash",
  },
};
