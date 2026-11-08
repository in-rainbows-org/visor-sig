/**
 * Entidades y tipos de dominio para el asistente guiado de creación de rutas (Wizard).
 */

export enum RouteWizardStep {
  WELCOME = 0,        // Pantalla de bienvenida / inicio ("Comencemos")
  TECHNICIAN = 1,     // Selección de Técnico responsable
  SCHEDULE_DATE = 2,  // Fecha de asignación
  SERVICE_TYPE = 3,   // Selección de Tipo de Servicio (Cortes vs Reconexiones)
  STARTING_POINT = 4, // Selección interactiva de Punto de Partida en el mapa
  STOPS_CART = 5,     // Carrito de paradas, búsqueda, reordenamiento y cálculo
  SUMMARY = 6,        // Resumen final y confirmación deslizable
}

export type RouteServiceType = "CUT" | "RECONNECTION";

export type RouteCalculationState = "idle" | "calculating" | "calculated";

export type RouteTechnician = {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role?: string;
};

export type RouteStartingPoint = {
  latitude: number;
  longitude: number;
  label?: string;
};

export type RouteCartStop = {
  id: string;             // Identificador único dentro del carrito
  orderIndex: number;     // Posición o secuencia del recorrido (1..N)
  fixedCodeId: string;    // ID del código fijo en el sistema
  fixedCode: number | null; // Número visible de código fijo (ej. 1024 o null)
  name: string | null;    // Nombre del titular o propietario (o null)
  status: number;         // Estado actual del inmueble (1: Normal, etc.)
  serviceType?: RouteServiceType; // Tipo de servicio asignado
  targetStatus?: number;  // Estado resultante proyectado
  latitude: number;       // Coordenada latitud
  longitude: number;      // Coordenada longitud
  routeGeometry?: Record<string, unknown> | string | null; // Geometría opcional de tramo (GeoJSON LineString)
};

export type OptimizedStop = {
  codigoFijoId: string;
  orderIndex: number;
  latitude: number;
  longitude: number;
  legDistanceKm: number;
  legDurationSeconds: number;
  legGeometry?: Record<string, unknown> | string | null;
};

export type CalculatedRoute = {
  totalDistanceKm: number;
  totalDurationSeconds: number;
  encodedPolyline: string | null;
  coordinates: [number, number][]; // Coordenadas decodificadas [lat, lng] para Leaflet
  orderedStops: OptimizedStop[];
};

export type RouteCreationWizardState = {
  isStarted: boolean;
  currentStep: RouteWizardStep;
  selectedTechnician: RouteTechnician | null;
  scheduledDate: string | null;
  serviceType: RouteServiceType | null;
  startingPoint: RouteStartingPoint | null;
  cartStops: RouteCartStop[];
  calculationState: RouteCalculationState;
  calculatedRoute: CalculatedRoute | null;
  isSaving: boolean;
  saveError: string | null;
};
