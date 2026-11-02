from dataclasses import dataclass
from typing import Any
from uuid import UUID


@dataclass(frozen=True, slots=True)
class WaypointInputDTO:
    """Datos geográficos de una parada de entrada para el cálculo de ruta."""

    codigo_fijo_id: UUID
    latitude: float
    longitude: float


@dataclass(frozen=True, slots=True)
class RouteCalculationRequestDTO:
    """Solicitud de cálculo de ruta vial."""

    start_latitude: float
    start_longitude: float
    waypoints: tuple[WaypointInputDTO, ...]
    optimize_waypoint_order: bool = True


@dataclass(frozen=True, slots=True)
class RouteLegDTO:
    """Información de un tramo individual de la ruta entre dos puntos."""

    distance_meters: int
    distance_km: float
    duration_seconds: int
    encoded_polyline: str
    geometry: dict[str, Any]


@dataclass(frozen=True, slots=True)
class OptimizedStopDTO:
    """Parada con su orden secuencial optimizado y la información del tramo que llega a ella."""

    codigo_fijo_id: UUID
    order_index: int
    latitude: float
    longitude: float
    leg_distance_km: float
    leg_duration_seconds: int
    leg_geometry: dict[str, Any]


@dataclass(frozen=True, slots=True)
class RouteCalculationResultDTO:
    """Resultado global del cálculo de ruta retornado por el servicio de ruteo."""

    total_distance_km: float
    total_duration_seconds: int
    encoded_polyline: str
    ordered_stops: tuple[OptimizedStopDTO, ...]
