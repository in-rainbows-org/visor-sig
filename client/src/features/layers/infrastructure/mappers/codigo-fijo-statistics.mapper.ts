import type {
  CodigoFijoStatistics,
  FixedCodeStatusKey,
  StatusMetricItem,
} from "@/features/layers/domain/entities/codigo-fijo-statistics.entity";
import type { CodigoFijoStatisticsDTO } from "@/features/layers/infrastructure/schemas/codigo-fijo-statistics.schema";

const STATUS_METRIC_CONFIG: Record<
  FixedCodeStatusKey,
  {
    label: string;
    colorHex: string;
    bgTailwind: string;
    textTailwind: string;
    iconAsset: string;
  }
> = {
  normal: {
    label: "Normal",
    colorHex: "#4cc057",
    bgTailwind: "bg-emerald-500",
    textTailwind: "text-emerald-600",
    iconAsset: "/dashboard-icons/stats-icons/normal-dash.png",
  },
  para_corte: {
    label: "Para corte",
    colorHex: "#fe9b24",
    bgTailwind: "bg-amber-500",
    textTailwind: "text-amber-600",
    iconAsset: "/dashboard-icons/stats-icons/para-corte-dash.png",
  },
  cortado: {
    label: "Cortado",
    colorHex: "#fb2f3a",
    bgTailwind: "bg-red-500",
    textTailwind: "text-red-600",
    iconAsset: "/dashboard-icons/stats-icons/cortado-dash.png",
  },
  baja_parcial: {
    label: "Baja parcial",
    colorHex: "#fcca1e",
    bgTailwind: "bg-purple-500",
    textTailwind: "text-purple-600",
    iconAsset: "/dashboard-icons/stats-icons/baja-parcial-dash.png",
  },
  baja_total: {
    label: "Baja total",
    colorHex: "#8347fb",
    bgTailwind: "bg-slate-500",
    textTailwind: "text-slate-600",
    iconAsset: "/dashboard-icons/stats-icons/baja-total-dash.png",
  },
};

export const codigoFijoStatisticsMapper = {
  toDomain(dto: CodigoFijoStatisticsDTO): CodigoFijoStatistics {
    return {
      total: dto.total,
      normal: dto.normal,
      paraCorte: dto.para_corte,
      cortado: dto.cortado,
      bajaParcial: dto.baja_parcial,
      bajaTotal: dto.baja_total,
    };
  },

  toStatusMetrics(stats: CodigoFijoStatistics): StatusMetricItem[] {
    const total = stats.total > 0 ? stats.total : 0;

    const items: Array<{ key: FixedCodeStatusKey; count: number }> = [
      { key: "normal", count: stats.normal },
      { key: "para_corte", count: stats.paraCorte },
      { key: "cortado", count: stats.cortado },
      { key: "baja_parcial", count: stats.bajaParcial },
      { key: "baja_total", count: stats.bajaTotal },
    ];

    return items.map(({ key, count }) => {
      const config = STATUS_METRIC_CONFIG[key];
      const rawPct = total > 0 ? (count / total) * 100 : 0;
      const percentage = Math.round(rawPct * 100) / 100;
      const percentageFormatted = `${percentage.toFixed(2)} %`;

      return {
        key,
        label: config.label,
        count,
        percentage,
        percentageFormatted,
        colorHex: config.colorHex,
        bgTailwind: config.bgTailwind,
        textTailwind: config.textTailwind,
        iconAsset: config.iconAsset,
      };
    });
  },
};
