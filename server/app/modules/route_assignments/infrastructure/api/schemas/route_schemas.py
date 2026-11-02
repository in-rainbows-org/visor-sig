from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field


class WaypointInputRequest(BaseModel):
    """Parada de entrada con coordenadas y referencia a código fijo."""

    codigo_fijo_id: UUID = Field(description="Identificador del código fijo")
    latitude: float = Field(description="Latitud geográfica de la parada")
    longitude: float = Field(description="Longitud geográfica de la parada")


class CalculateRouteRequest(BaseModel):
    """Petición para calcular y ordenar una ruta vial."""

    start_latitude: float = Field(description="Latitud del punto de salida de la brigada")
    start_longitude: float = Field(description="Longitud del punto de salida de la brigada")
    optimize_waypoint_order: bool = Field(
        default=True,
        description="Si es true, OSRM optimiza el orden de visita más eficiente (TSP)",
    )
    waypoints: list[WaypointInputRequest] = Field(
        min_length=1,
        max_length=10,
        description="Lista de 1 a 10 paradas viales a visitar",
    )


class OptimizedStopRead(BaseModel):
    """Parada con su secuencia ordenada y datos del tramo que llega a ella."""

    codigo_fijo_id: UUID
    order_index: int
    latitude: float
    longitude: float
    leg_distance_km: float
    leg_duration_seconds: int
    leg_geometry: dict[str, Any]


class CalculateRouteRead(BaseModel):
    """Resultado del cálculo y ordenamiento de ruta."""

    total_distance_km: float
    total_duration_seconds: int
    encoded_polyline: str
    ordered_stops: list[OptimizedStopRead]
