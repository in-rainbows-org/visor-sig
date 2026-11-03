/**
 * NOTA DE ARQUITECTURA:
 * Los registros MOCK_ROUTE_ASSIGNMENTS están DEPRECADOS para el listado del historial
 * ya que la tabla ahora se alimenta directamente de `GET /api/route-assignments/assignments`.
 * Se mantienen exclusivamente para alimentar el gráfico estadístico superior ficticio
 * solicitado por el usuario y como fallback en pruebas unitarias locales.
 */
import { RouteAssignment, AssignmentStatus } from "../../domain/entities/route-assignment.entity";
import {
  RouteAssignmentPieStats,
  StackedBarsSummary,
} from "../../domain/entities/route-assignment-stats.entity";

/**
 * Conjunto de asignaciones de ruta representativas para el gráfico de estadísticas superior
 */
export const MOCK_ROUTE_ASSIGNMENTS: RouteAssignment[] = [
  {
    id: "asg-001",
    routeCode: "RUT-01",
    routeName: "Sector Norte - Polígono Industrial",
    workerId: "w-01",
    workerName: "Carlos Mendoza",
    totalStops: 42,
    completedStops: 38,
    observedStops: 3,
    failedStops: 1,
    scheduledDate: "2026-11-01",
    assignedDate: "2026-10-31",
    status: "IN_PROGRESS",
  },
  {
    id: "asg-002",
    routeCode: "RUT-02",
    routeName: "Sector Centro - Eje Comercial Av. Bolívar",
    workerId: "w-02",
    workerName: "Elena Rojas",
    totalStops: 35,
    completedStops: 35,
    observedStops: 0,
    failedStops: 0,
    scheduledDate: "2026-10-31",
    assignedDate: "2026-10-30",
    status: "COMPLETED",
  },
  {
    id: "asg-003",
    routeCode: "RUT-03",
    routeName: "Sector Sur - Urbanización Los Pinos",
    workerId: "w-03",
    workerName: "Andrés Silva",
    totalStops: 50,
    completedStops: 44,
    observedStops: 4,
    failedStops: 2,
    scheduledDate: "2026-10-30",
    assignedDate: "2026-10-29",
    status: "COMPLETED",
  },
  {
    id: "asg-004",
    routeCode: "RUT-04",
    routeName: "Casco Histórico - Cuadrante Patrimonial",
    workerId: "w-04",
    workerName: "Mariana Valenzuela",
    totalStops: 28,
    completedStops: 0,
    observedStops: 0,
    failedStops: 0,
    scheduledDate: "2026-11-02",
    assignedDate: "2026-11-01",
    status: "PENDING",
  },
  {
    id: "asg-005",
    routeCode: "RUT-05",
    routeName: "Zona Este - Residencial Bella Vista",
    workerId: "w-05",
    workerName: "Rodrigo Peña",
    totalStops: 46,
    completedStops: 39,
    observedStops: 5,
    failedStops: 2,
    scheduledDate: "2026-10-29",
    assignedDate: "2026-10-28",
    status: "COMPLETED",
  },
  {
    id: "asg-006",
    routeCode: "RUT-06",
    routeName: "Sector Oeste - Barrio Las Acacias",
    workerId: "w-01",
    workerName: "Carlos Mendoza",
    totalStops: 32,
    completedStops: 30,
    observedStops: 2,
    failedStops: 0,
    scheduledDate: "2026-10-28",
    assignedDate: "2026-10-27",
    status: "COMPLETED",
  },
  {
    id: "asg-007",
    routeCode: "RUT-07",
    routeName: "Ribera del Río - Franja Catastral 4",
    workerId: "w-02",
    workerName: "Elena Rojas",
    totalStops: 38,
    completedStops: 24,
    observedStops: 8,
    failedStops: 6,
    scheduledDate: "2026-11-01",
    assignedDate: "2026-10-31",
    status: "IN_PROGRESS",
  },
  {
    id: "asg-008",
    routeCode: "RUT-08",
    routeName: "Parque Metropolitano - Corredor Verde",
    workerId: "w-03",
    workerName: "Andrés Silva",
    totalStops: 22,
    completedStops: 0,
    observedStops: 0,
    failedStops: 0,
    scheduledDate: "2026-11-03",
    assignedDate: "2026-11-01",
    status: "PENDING",
  },
  {
    id: "asg-009",
    routeCode: "RUT-09",
    routeName: "Polígono Norte - Manzanas 24 a 30",
    workerId: "w-04",
    workerName: "Mariana Valenzuela",
    totalStops: 54,
    completedStops: 48,
    observedStops: 4,
    failedStops: 2,
    scheduledDate: "2026-10-27",
    assignedDate: "2026-10-26",
    status: "COMPLETED",
  },
  {
    id: "asg-010",
    routeCode: "RUT-10",
    routeName: "Distrito Financiero - Torres Principales",
    workerId: "w-05",
    workerName: "Rodrigo Peña",
    totalStops: 18,
    completedStops: 16,
    observedStops: 2,
    failedStops: 0,
    scheduledDate: "2026-10-26",
    assignedDate: "2026-10-25",
    status: "COMPLETED",
  },
  {
    id: "asg-011",
    routeCode: "RUT-11",
    routeName: "Sector Sureste - Complejo Deportivo",
    workerId: "w-01",
    workerName: "Carlos Mendoza",
    totalStops: 40,
    completedStops: 34,
    observedStops: 4,
    failedStops: 2,
    scheduledDate: "2026-10-25",
    assignedDate: "2026-10-24",
    status: "COMPLETED",
  },
  {
    id: "asg-012",
    routeCode: "RUT-12",
    routeName: "Colinas del Sol - Ladera Alta",
    workerId: "w-02",
    workerName: "Elena Rojas",
    totalStops: 30,
    completedStops: 22,
    observedStops: 5,
    failedStops: 3,
    scheduledDate: "2026-10-24",
    assignedDate: "2026-10-23",
    status: "COMPLETED",
  },
  {
    id: "asg-013",
    routeCode: "RUT-13",
    routeName: "Acceso Norte - Vía Panamericana Km 12",
    workerId: "w-03",
    workerName: "Andrés Silva",
    totalStops: 45,
    completedStops: 0,
    observedStops: 0,
    failedStops: 0,
    scheduledDate: "2026-11-04",
    assignedDate: "2026-11-01",
    status: "PENDING",
  },
  {
    id: "asg-014",
    routeCode: "RUT-14",
    routeName: "Barrio El Progreso - Sector 3",
    workerId: "w-04",
    workerName: "Mariana Valenzuela",
    totalStops: 36,
    completedStops: 20,
    observedStops: 12,
    failedStops: 4,
    scheduledDate: "2026-11-01",
    assignedDate: "2026-10-31",
    status: "IN_PROGRESS",
  },
  {
    id: "asg-015",
    routeCode: "RUT-15",
    routeName: "Parque Tecnológico - Bloque A y B",
    workerId: "w-05",
    workerName: "Rodrigo Peña",
    totalStops: 26,
    completedStops: 25,
    observedStops: 1,
    failedStops: 0,
    scheduledDate: "2026-10-22",
    assignedDate: "2026-10-21",
    status: "COMPLETED",
  },
  {
    id: "asg-016",
    routeCode: "RUT-16",
    routeName: "Sector Central - Mercado Municipal",
    workerId: "w-01",
    workerName: "Carlos Mendoza",
    totalStops: 48,
    completedStops: 40,
    observedStops: 6,
    failedStops: 2,
    scheduledDate: "2026-10-21",
    assignedDate: "2026-10-20",
    status: "COMPLETED",
  },
  {
    id: "asg-017",
    routeCode: "RUT-17",
    routeName: "Urbanización Los Laureles - Etapa 2",
    workerId: "w-02",
    workerName: "Elena Rojas",
    totalStops: 33,
    completedStops: 0,
    observedStops: 0,
    failedStops: 0,
    scheduledDate: "2026-11-05",
    assignedDate: "2026-11-01",
    status: "PENDING",
  },
  {
    id: "asg-018",
    routeCode: "RUT-18",
    routeName: "Loteo Campestre - Sector Mirador",
    workerId: "w-03",
    workerName: "Andrés Silva",
    totalStops: 29,
    completedStops: 26,
    observedStops: 2,
    failedStops: 1,
    scheduledDate: "2026-10-19",
    assignedDate: "2026-10-18",
    status: "COMPLETED",
  },
  {
    id: "asg-019",
    routeCode: "RUT-19",
    routeName: "Barrio San José - Calles 5 a 11",
    workerId: "w-04",
    workerName: "Mariana Valenzuela",
    totalStops: 37,
    completedStops: 32,
    observedStops: 3,
    failedStops: 2,
    scheduledDate: "2026-10-18",
    assignedDate: "2026-10-17",
    status: "COMPLETED",
  },
  {
    id: "asg-020",
    routeCode: "RUT-20",
    routeName: "Zona Portuaria - Almacenes de Carga",
    workerId: "w-05",
    workerName: "Rodrigo Peña",
    totalStops: 52,
    completedStops: 30,
    observedStops: 15,
    failedStops: 7,
    scheduledDate: "2026-11-01",
    assignedDate: "2026-10-31",
    status: "IN_PROGRESS",
  },
  {
    id: "asg-021",
    routeCode: "RUT-21",
    routeName: "Avenida Circunvalación - Tramo Este",
    workerId: "w-01",
    workerName: "Carlos Mendoza",
    totalStops: 30,
    completedStops: 0,
    observedStops: 0,
    failedStops: 0,
    scheduledDate: "2026-11-06",
    assignedDate: "2026-11-01",
    status: "PENDING",
  },
  {
    id: "asg-022",
    routeCode: "RUT-22",
    routeName: "Sector Universitario - Campus Central",
    workerId: "w-02",
    workerName: "Elena Rojas",
    totalStops: 28,
    completedStops: 0,
    observedStops: 0,
    failedStops: 0,
    scheduledDate: "2026-11-06",
    assignedDate: "2026-11-01",
    status: "PENDING",
  },
  {
    id: "asg-023",
    routeCode: "RUT-23",
    routeName: "Zona Comercial Galerías",
    workerId: "w-03",
    workerName: "Andrés Silva",
    totalStops: 34,
    completedStops: 0,
    observedStops: 0,
    failedStops: 0,
    scheduledDate: "2026-11-07",
    assignedDate: "2026-11-02",
    status: "PENDING",
  },
  {
    id: "asg-024",
    routeCode: "RUT-24",
    routeName: "Lomas Verdes - Sector Colinas",
    workerId: "w-04",
    workerName: "Mariana Valenzuela",
    totalStops: 22,
    completedStops: 0,
    observedStops: 0,
    failedStops: 0,
    scheduledDate: "2026-11-07",
    assignedDate: "2026-11-02",
    status: "PENDING",
  },
  {
    id: "asg-025",
    routeCode: "RUT-25",
    routeName: "Barrio Las Palmeras - Etapa 3",
    workerId: "w-05",
    workerName: "Rodrigo Peña",
    totalStops: 36,
    completedStops: 0,
    observedStops: 0,
    failedStops: 0,
    scheduledDate: "2026-11-08",
    assignedDate: "2026-11-02",
    status: "PENDING",
  },
];

/**
 * Genera las estadísticas consolidadas para el gráfico de pastel/dona SVG
 * Tres estados: Completadas (Azul), En Proceso (Ámbar), Pendientes (Pizarra)
 */
export function getRouteAssignmentPieStats(
  assignments: RouteAssignment[] = MOCK_ROUTE_ASSIGNMENTS
): RouteAssignmentPieStats {
  const total = assignments.length;
  const completed = assignments.filter((a) => a.status === "COMPLETED").length;
  const inProgress = assignments.filter((a) => a.status === "IN_PROGRESS").length;
  const pending = assignments.filter((a) => a.status === "ASSIGNED" || a.status === "PENDING").length;

  const pct = (val: number) => (total > 0 ? (val / total) * 100 : 0);

  return {
    total,
    periodLabel: "Últimos 30 días",
    metrics: [
      {
        key: "COMPLETED",
        label: "Completadas",
        count: completed,
        percentage: pct(completed),
        percentageFormatted: `${Math.round(pct(completed))}%`,
        colorHex: "#4ba1fe", // Celeste completadas
      },
      {
        key: "IN_PROGRESS",
        label: "En Proceso",
        count: inProgress,
        percentage: pct(inProgress),
        percentageFormatted: `${Math.round(pct(inProgress))}%`,
        colorHex: "#8a50fb", // Morado en proceso
      },
      {
        key: "PENDING",
        label: "Pendientes",
        count: pending,
        percentage: pct(pending),
        percentageFormatted: `${Math.round(pct(pending))}%`,
        colorHex: "#fdd94f", // Amarillo pendientes (mismo color que StackedBars)
      },
    ],
  };
}

/**
 * Convierte las 25 asignaciones en el formato consumible por StackedBars (estilo Bencho)
 */
export function getStackedBarsSummary(
  assignments: RouteAssignment[] = MOCK_ROUTE_ASSIGNMENTS
): StackedBarsSummary {
  // Tomar las 25 más recientes
  const targetAssignments = assignments.slice(0, 25);

  const bars = targetAssignments.map((a) => {
    const completedCount = a.completedStops ?? 0;
    const observedCount = a.observedStops ?? 0;
    const failedCount = a.failedStops ?? 0;
    const totalValid = completedCount + observedCount;
    const totalPoints = totalValid + failedCount;

    return {
      assignmentId: a.id,
      routeCode: a.routeCode,
      workerName: a.workerName,
      scheduledDate: a.scheduledDate,
      completedCount,
      observedCount,
      failedCount,
      totalValid,
      totalPoints: totalPoints || a.totalStops,
    };
  });

  const totalPointsProcessed = bars.reduce((acc, curr) => acc + curr.totalPoints, 0);

  return {
    totalPointsProcessed,
    assignmentsCount: bars.length,
    bars,
  };
}

export const MOCK_FIXED_CODE_CANDIDATES = [
  {
    id: "cf-cand-01",
    fixedCode: 1024,
    name: "Carlos Mendoza Quispe",
    status: 1,
    latitude: -17.7833,
    longitude: -63.1821,
  },
  {
    id: "cf-cand-02",
    fixedCode: 1025,
    name: "Mariana Valenzuela",
    status: 2,
    latitude: -17.7845,
    longitude: -63.1835,
  },
  {
    id: "cf-cand-03",
    fixedCode: 1028,
    name: "Jorge Gutierrez",
    status: 1,
    latitude: -17.7820,
    longitude: -63.1805,
  },
  {
    id: "cf-cand-04",
    fixedCode: 1030,
    name: "Ana Fernandez Rojas",
    status: 3,
    latitude: -17.7852,
    longitude: -63.1850,
  },
  {
    id: "cf-cand-05",
    fixedCode: 1042,
    name: "Roberto Duran",
    status: 1,
    latitude: -17.7811,
    longitude: -63.1790,
  },
  {
    id: "cf-cand-06",
    fixedCode: 1055,
    name: "Elena Rojas Perez",
    status: 1,
    latitude: -17.7865,
    longitude: -63.1870,
  },
];
