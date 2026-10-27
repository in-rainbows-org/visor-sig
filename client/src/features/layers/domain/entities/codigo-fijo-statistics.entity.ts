/**
 * Entidad de dominio para estadísticas agregadas de códigos fijos.
 */

export interface CodigoFijoStatistics {
  readonly total: number;
  readonly normal: number;
  readonly paraCorte: number;
  readonly cortado: number;
  readonly bajaParcial: number;
  readonly bajaTotal: number;
}

export type FixedCodeStatusKey =
  | "normal"
  | "para_corte"
  | "cortado"
  | "baja_parcial"
  | "baja_total";

export interface StatusMetricItem {
  readonly key: FixedCodeStatusKey;
  readonly label: string;
  readonly count: number;
  readonly percentage: number;
  readonly percentageFormatted: string;
  readonly colorHex: string;
  readonly bgTailwind: string;
  readonly textTailwind: string;
  readonly iconAsset: string;
}
