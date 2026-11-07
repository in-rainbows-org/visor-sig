import type {
  ActiveAssignmentProgress,
  PendingAssignmentsSummary,
  TechnicianPerformanceBar,
  TechnicianFeedItem,
} from "../../domain/entities/technician-dashboard.entity";

/**
 * Asignación activa en progreso para el Card Hero azul.
 */
export const MOCK_ACTIVE_ASSIGNMENT: ActiveAssignmentProgress = {
  id: "act-route-001",
  routeCode: "RUT-REC-014",
  serviceType: "RECONNECTION",
  startedAt: "24 de Octubre, 08:30 AM",
  completedStops: 8,
  totalStops: 10,
  status: "IN_PROGRESS",
  targetUrl: "/mis-asignaciones",
};

/**
 * Resumen de asignaciones pendientes.
 */
export const MOCK_PENDING_SUMMARY: PendingAssignmentsSummary = {
  totalPending: 8,
  todayCount: 3,
};

/**
 * Datos históricos y recientes para el gráfico de barras apiladas del técnico.
 */
export const MOCK_TECHNICIAN_BARS: TechnicianPerformanceBar[] = [
  {
    id: "bar-01",
    routeCode: "RUT-COR-001",
    scheduledDate: "2026-10-10",
    completedStops: 14,
    pendingStops: 2,
    failedStops: 1,
  },
  {
    id: "bar-02",
    routeCode: "RUT-REC-002",
    scheduledDate: "2026-10-11",
    completedStops: 18,
    pendingStops: 1,
    failedStops: 0,
  },
  {
    id: "bar-03",
    routeCode: "RUT-COR-003",
    scheduledDate: "2026-10-12",
    completedStops: 12,
    pendingStops: 3,
    failedStops: 2,
  },
  {
    id: "bar-04",
    routeCode: "RUT-REC-004",
    scheduledDate: "2026-10-13",
    completedStops: 22,
    pendingStops: 2,
    failedStops: 1,
  },
  {
    id: "bar-05",
    routeCode: "RUT-COR-005",
    scheduledDate: "2026-10-14",
    completedStops: 15,
    pendingStops: 1,
    failedStops: 0,
  },
  {
    id: "bar-06",
    routeCode: "RUT-REC-006",
    scheduledDate: "2026-10-15",
    completedStops: 20,
    pendingStops: 2,
    failedStops: 1,
  },
  {
    id: "bar-07",
    routeCode: "RUT-COR-007",
    scheduledDate: "2026-10-16",
    completedStops: 16,
    pendingStops: 3,
    failedStops: 2,
  },
  {
    id: "bar-08",
    routeCode: "RUT-REC-008",
    scheduledDate: "2026-10-17",
    completedStops: 24,
    pendingStops: 1,
    failedStops: 0,
  },
  {
    id: "bar-09",
    routeCode: "RUT-COR-009",
    scheduledDate: "2026-10-18",
    completedStops: 13,
    pendingStops: 4,
    failedStops: 1,
  },
  {
    id: "bar-10",
    routeCode: "RUT-REC-010",
    scheduledDate: "2026-10-19",
    completedStops: 19,
    pendingStops: 1,
    failedStops: 1,
  },
  {
    id: "bar-11",
    routeCode: "RUT-COR-011",
    scheduledDate: "2026-10-20",
    completedStops: 17,
    pendingStops: 2,
    failedStops: 0,
  },
  {
    id: "bar-12",
    routeCode: "RUT-REC-012",
    scheduledDate: "2026-10-21",
    completedStops: 21,
    pendingStops: 1,
    failedStops: 1,
  },
  {
    id: "bar-13",
    routeCode: "RUT-COR-013",
    scheduledDate: "2026-10-22",
    completedStops: 15,
    pendingStops: 2,
    failedStops: 2,
  },
  {
    id: "bar-14",
    routeCode: "RUT-REC-014",
    scheduledDate: "2026-10-23",
    completedStops: 18,
    pendingStops: 1,
    failedStops: 0,
  },
  {
    id: "bar-15",
    routeCode: "RUT-COR-015",
    scheduledDate: "2026-10-24",
    completedStops: 16,
    pendingStops: 3,
    failedStops: 1,
  },
];

/**
 * Listado de asignaciones pendientes programadas ("Asignadas").
 */
export const MOCK_ASSIGNED_FEED: TechnicianFeedItem[] = [
  {
    id: "feed-asg-001",
    routeCode: "RUT-COR-021",
    serviceType: "CUT",
    scheduledDate: "2026-10-24",
    totalStops: 12,
    distanceKm: 14.2,
    status: "ASSIGNED",
  },
  {
    id: "feed-asg-002",
    routeCode: "RUT-REC-022",
    serviceType: "RECONNECTION",
    scheduledDate: "2026-10-24",
    totalStops: 15,
    distanceKm: 18.5,
    status: "ASSIGNED",
  },
  {
    id: "feed-asg-003",
    routeCode: "RUT-COR-023",
    serviceType: "CUT",
    scheduledDate: "2026-10-25",
    totalStops: 9,
    distanceKm: 8.1,
    status: "ASSIGNED",
  },
  {
    id: "feed-asg-004",
    routeCode: "RUT-REC-024",
    serviceType: "RECONNECTION",
    scheduledDate: "2026-10-25",
    totalStops: 20,
    distanceKm: 22.0,
    status: "ASSIGNED",
  },
  {
    id: "feed-asg-005",
    routeCode: "RUT-COR-025",
    serviceType: "CUT",
    scheduledDate: "2026-10-26",
    totalStops: 14,
    distanceKm: 16.3,
    status: "ASSIGNED",
  },
];

/**
 * Listado de asignaciones completadas históricas ("Completadas").
 */
export const MOCK_COMPLETED_FEED: TechnicianFeedItem[] = [
  {
    id: "feed-cmp-001",
    routeCode: "RUT-REC-019",
    serviceType: "RECONNECTION",
    scheduledDate: "2026-10-23",
    completedAt: "23 Oct, 16:45",
    totalStops: 16,
    distanceKm: 19.8,
    status: "COMPLETED",
  },
  {
    id: "feed-cmp-002",
    routeCode: "RUT-COR-018",
    serviceType: "CUT",
    scheduledDate: "2026-10-23",
    completedAt: "23 Oct, 13:10",
    totalStops: 11,
    distanceKm: 12.4,
    status: "COMPLETED",
  },
  {
    id: "feed-cmp-003",
    routeCode: "RUT-REC-017",
    serviceType: "RECONNECTION",
    scheduledDate: "2026-10-22",
    completedAt: "22 Oct, 17:20",
    totalStops: 18,
    distanceKm: 24.1,
    status: "COMPLETED",
  },
  {
    id: "feed-cmp-004",
    routeCode: "RUT-COR-016",
    serviceType: "CUT",
    scheduledDate: "2026-10-21",
    completedAt: "21 Oct, 15:00",
    totalStops: 14,
    distanceKm: 15.6,
    status: "COMPLETED",
  },
];
