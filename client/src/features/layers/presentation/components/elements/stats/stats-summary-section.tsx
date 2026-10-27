"use client";

import React, { useState, useTransition } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CodigoFijoStatistics } from "@/features/layers/domain/entities/codigo-fijo-statistics.entity";
import { getCodigoFijoStatisticsAction } from "@/features/layers/presentation/actions/codigo-fijo-statistics.action";
import { StatsMetricCards } from "./stats-metric-cards";
import { StatsGraphicsCards } from "./stats-graphics-cards";
import { StatsSectionHeader } from "./stats-section-header";

export interface StatsSummarySectionProps {
  initialStats: CodigoFijoStatistics | null;
  hasError?: boolean;
  errorMessage?: string;
  children?: React.ReactNode;
}

const DEFAULT_EMPTY_STATS: CodigoFijoStatistics = {
  total: 0,
  normal: 0,
  paraCorte: 0,
  cortado: 0,
  bajaParcial: 0,
  bajaTotal: 0,
};

function formatCurrentDateTime(): string {
  const now = new Date();
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(now);
}

export function StatsSummarySection({
  initialStats,
  hasError = false,
  errorMessage,
  children,
}: StatsSummarySectionProps) {
  const [stats, setStats] = useState<CodigoFijoStatistics>(
    initialStats ?? DEFAULT_EMPTY_STATS
  );
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string>(formatCurrentDateTime);
  const [error, setError] = useState<string | null>(
    hasError ? (errorMessage ?? "Error al cargar las estadísticas.") : null
  );
  const [isPending, startTransition] = useTransition();

  const handleRefresh = () => {
    startTransition(async () => {
      try {
        const result = await getCodigoFijoStatisticsAction();
        if (result.ok) {
          setStats(result.data);
          setLastUpdatedAt(formatCurrentDateTime());
          setError(null);
        } else {
          setError(result.errors?.[0] ?? "No se pudieron refrescar las estadísticas.");
        }
      } catch {
        setError("Error de conexión al consultar estadísticas.");
      }
    });
  };

  return (
    <section aria-label="Resumen Estadístico" className="space-y-4">
      {/* Cabecera con Título y Badge de Actualización */}
      <StatsSectionHeader
        lastUpdatedAt={lastUpdatedAt}
        onRefresh={handleRefresh}
        isRefreshing={isPending}
      />

      {/* Alerta de error si falla la consulta */}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 flex items-center justify-between gap-3 text-red-900 shadow-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <p className="text-xs font-semibold truncate">{error}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isPending}
            className="gap-1.5 rounded-xl border-red-300 bg-white text-xs font-semibold text-red-800 hover:bg-red-100"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isPending ? "animate-spin" : ""}`} />
            Reintentar
          </Button>
        </div>
      )}

      {/* Fila 1: Tarjetas Métricas */}
      <StatsMetricCards stats={stats} />

      {/* Fila 2: Gráficos Estadísticos */}
      <StatsGraphicsCards stats={stats} />

      {/* Contenido adicional */}
      {children}
    </section>
  );
}
