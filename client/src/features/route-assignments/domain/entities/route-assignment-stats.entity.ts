import { AssignmentStatus } from "./route-assignment.entity";

/**
 * Métrica individual de estado para el gráfico de pastel/dona
 */
export type RouteStatusMetric = {
  key: AssignmentStatus;
  label: string;
  count: number;
  percentage: number;
  percentageFormatted: string;
  colorHex: string;
};

/**
 * Estadísticas consolidadas para el gráfico de distribución por estado (Dona SVG)
 */
export type RouteAssignmentPieStats = {
  total: number;
  periodLabel: string;
  metrics: RouteStatusMetric[];
};

/**
 * Registro de barra apilada individual (estilo Bencho)
 * Una asignación con desglose de paradas completadas, observadas y fallidas.
 */
export type RouteStackedBar = {
  assignmentId: string;
  routeCode: string;
  workerName: string;
  scheduledDate: string;
  completedCount: number; // Nivel 1 sobre línea base (Azul)
  observedCount: number;  // Nivel 2 sobre línea base (Amarillo)
  failedCount: number;    // Debajo de la línea base (Rojo)
  totalValid: number;     // completedCount + observedCount
  totalPoints: number;    // totalValid + failedCount
};

/**
 * Resumen para el componente StackedBars
 */
export type StackedBarsSummary = {
  totalPointsProcessed: number;
  assignmentsCount: number;
  bars: RouteStackedBar[];
};

/**
 * Filtros de búsqueda para el historial de asignaciones
 */
export type RouteHistoryFilter = {
  routeCode?: string;
  startDate?: string;
  endDate?: string;
  workerId?: string;
};

/**
 * Resumen de técnico/trabajador para los selectores de filtro
 */
export type WorkerOption = {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
};
