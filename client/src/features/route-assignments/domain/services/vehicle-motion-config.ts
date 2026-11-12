/** Parámetros del movimiento visual; no cambian la frecuencia del GPS/WebSocket. */
/**
 * Umbrales iniciales del movimiento visual. Se centralizan para que el
 * seguimiento pueda ajustarse con recorridos reales sin tocar la geometría.
 */
export const VEHICLE_MOTION_CONFIG = {
  /** Desplazamientos menores se tratan como ruido/detención GPS. */
  stationaryThresholdMeters: 4,
  /** Distancia máxima a la polilínea para considerar confiable el ajuste vial. */
  maxRouteSnapMeters: 40,
  /** Límite físico usado para descartar teletransportes y velocidades anómalas. */
  maxPlausibleSpeedMetersPerSecond: 45,
  /** Sin una muestra reciente, se detiene el efecto y se avisa al usuario. */
  staleAfterMs: 15_000,
  /** Mantiene movimiento visible durante casi toda la espera del siguiente fix. */
  animationCadenceRatio: 0.94,
  minAnimationDurationMs: 400,
  maxAnimationDurationMs: 4_500,
  directionToleranceMeters: 2,
  catchUpDurationRatio: 0.75,
  /** Limita redibujos de la polilínea en Leaflet sin afectar la suavidad del vehículo. */
  routeProgressUpdateIntervalMs: 50,
  /** Permite detectar proyecciones ambiguas en rutas curvas o próximas a sí mismas. */
  maxRouteProgressDisagreementMeters: 45,
} as const;
