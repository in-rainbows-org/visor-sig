"use client";

import React from "react";
import type { CodigoFijoStatistics } from "@/features/layers/domain/entities/codigo-fijo-statistics.entity";
import { StatsDistributionChart } from "./stats-distribution-chart";
import { StatsStatusProgressChart } from "./stats-status-progress-chart";

export interface StatsGraphicsCardsProps {
  stats: CodigoFijoStatistics;
}

export function StatsGraphicsCards({ stats }: StatsGraphicsCardsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 items-stretch">
      <StatsDistributionChart stats={stats} />
      <StatsStatusProgressChart stats={stats} />
    </div>
  );
}
