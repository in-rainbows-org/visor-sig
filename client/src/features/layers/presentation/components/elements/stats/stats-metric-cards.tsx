"use client";

import React from "react";
import type { CodigoFijoStatistics } from "@/features/layers/domain/entities/codigo-fijo-statistics.entity";
import { codigoFijoStatisticsMapper } from "@/features/layers/infrastructure/mappers/codigo-fijo-statistics.mapper";
import { StatsMetricCard } from "./stats-metric-card";

export interface StatsMetricCardsProps {
  stats: CodigoFijoStatistics;
}

export function StatsMetricCards({ stats }: StatsMetricCardsProps) {
  const statusMetrics = codigoFijoStatisticsMapper.toStatusMetrics(stats);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
      {/* 1. Tarjeta Total: Full-width en mobile/tablet, 1 col en desktop */}
      <StatsMetricCard
        title="Total de códigos fijos"
        count={stats.total}
        isTotal={true}
        iconAsset="/dashboard-icons/stats-icons/total-codigos-dash.webp"
        percentageFormatted="100% Cobertura"
        className="col-span-2 md:col-span-3 xl:col-span-1"
      />

      {/* 2-6. Tarjetas de Estado Operativo */}
      {statusMetrics.map((item) => (
        <StatsMetricCard
          key={item.key}
          title={item.label}
          count={item.count}
          colorHex={item.colorHex}
          iconAsset={item.iconAsset}
          percentageFormatted={item.percentageFormatted}
          className="col-span-1"
        />
      ))}
    </div>
  );
}
