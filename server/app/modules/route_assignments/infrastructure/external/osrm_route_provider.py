import logging
import math
from typing import Any

import httpx

from app.modules.route_assignments.application.dtos.route_dtos import (
    OptimizedStopDTO,
    RouteCalculationRequestDTO,
    RouteCalculationResultDTO,
    WaypointInputDTO,
)
from app.modules.route_assignments.application.ports.providers.route_calculator_provider import (
    RouteCalculatorProvider,
)
from app.modules.route_assignments.domain.exceptions import OSRMRouteException

logger = logging.getLogger(__name__)


def encode_polyline(coordinates: list[list[float]]) -> str:
    """
    Codifica una lista de coordenadas [lon, lat] en formato estándar Google Encoded Polyline.
    """
    result: list[str] = []
    prev_lat, prev_lon = 0, 0
    for lon, lat in coordinates:
        lat_i = int(round(lat * 1e5))
        lon_i = int(round(lon * 1e5))
        d_lat = lat_i - prev_lat
        d_lon = lon_i - prev_lon
        prev_lat, prev_lon = lat_i, lon_i
        for val in (d_lat, d_lon):
            val = ~(val << 1) if val < 0 else (val << 1)
            while val >= 0x20:
                result.append(chr((0x20 | (val & 0x1F)) + 63))
                val >>= 5
            result.append(chr(val + 63))
    return "".join(result)


class OSRMRouteProvider(RouteCalculatorProvider):
    """
    Adaptador de infraestructura para cálculo y optimización de rutas viales
    utilizando OSRM (Open Source Routing Machine) Trip API (/trip/v1/driving/).
    """

    def __init__(
        self,
        base_url: str = "https://router.project-osrm.org",
        timeout_seconds: float = 10.0,
    ) -> None:
        self.base_url = (base_url or "https://router.project-osrm.org").rstrip("/")
        self.timeout_seconds = timeout_seconds

    def calculate_route(self, request: RouteCalculationRequestDTO) -> RouteCalculationResultDTO:
        if not request.waypoints:
            raise OSRMRouteException("Debe proporcionar al menos una parada para calcular la ruta.")

        return self._call_osrm_trip_api(request)

    def _call_osrm_trip_api(self, request: RouteCalculationRequestDTO) -> RouteCalculationResultDTO:
        # Formato de coordenadas OSRM: {lon},{lat}
        all_coords = [f"{request.start_longitude},{request.start_latitude}"] + [
            f"{wp.longitude},{wp.latitude}" for wp in request.waypoints
        ]
        coords_str = ";".join(all_coords)
        url = f"{self.base_url}/trip/v1/driving/{coords_str}"

        params: dict[str, Any] = {
            "source": "first",
            "roundtrip": "false",
            "overview": "full",
            "geometries": "geojson",
            "steps": "true",
        }

        try:
            with httpx.Client(timeout=self.timeout_seconds) as client:
                response = client.get(url, params=params)
        except Exception as exc:
            logger.warning(
                "No fue posible conectar con OSRM (%s). Utilizando estimación local de respaldo.",
                exc,
            )
            return self._calculate_fallback_route(request)

        if response.status_code != 200:
            logger.warning(
                "OSRM respondió con código HTTP %s: %s. Utilizando estimación local de respaldo.",
                response.status_code,
                response.text,
            )
            return self._calculate_fallback_route(request)

        data = response.json()
        if data.get("code") != "Ok" or not data.get("trips"):
            logger.warning(
                "OSRM no encontró rutas transitables (código: %s). Utilizando estimación local.",
                data.get("code"),
            )
            return self._calculate_fallback_route(request)

        trip = data["trips"][0]
        legs = trip.get("legs", [])
        waypoints_meta = data.get("waypoints", [])

        # waypoints_meta[0] corresponde al punto de partida (origen).
        # waypoints_meta[1..N] corresponden a cada wp de request.waypoints.
        # wp_meta["waypoint_index"] indica la posición en la secuencia de visita (1..N).
        input_waypoints = list(request.waypoints)
        indexed_waypoints: list[tuple[int, WaypointInputDTO]] = []

        for i, wp in enumerate(input_waypoints):
            if i + 1 < len(waypoints_meta):
                target_order = waypoints_meta[i + 1].get("waypoint_index", i + 1)
            else:
                target_order = i + 1
            indexed_waypoints.append((target_order, wp))

        # Ordenar las paradas según la secuencia óptima TSP calculada por OSRM
        indexed_waypoints.sort(key=lambda item: item[0])

        ordered_stops: list[OptimizedStopDTO] = []
        for seq_idx, (_, wp) in enumerate(indexed_waypoints):
            leg = legs[seq_idx] if seq_idx < len(legs) else {}
            leg_dist_meters = float(leg.get("distance", 0.0))
            leg_duration_seconds = int(float(leg.get("duration", 0.0)))

            # Extraer geometría del tramo a partir de los steps
            leg_coords: list[list[float]] = []
            for step in leg.get("steps", []):
                step_geom = step.get("geometry", {})
                coords = step_geom.get("coordinates", [])
                if coords:
                    if not leg_coords:
                        leg_coords.extend(coords)
                    else:
                        leg_coords.extend(coords[1:] if coords[0] == leg_coords[-1] else coords)

            leg_encoded = encode_polyline(leg_coords) if leg_coords else ""
            leg_geometry = {
                "type": "LineString",
                "coordinates": leg_coords,
                "distance_meters": round(leg_dist_meters, 2),
                "duration_seconds": leg_duration_seconds,
                "polyline": leg_encoded,
            }

            ordered_stops.append(
                OptimizedStopDTO(
                    codigo_fijo_id=wp.codigo_fijo_id,
                    order_index=seq_idx + 1,
                    latitude=wp.latitude,
                    longitude=wp.longitude,
                    leg_distance_km=round(leg_dist_meters / 1000.0, 3),
                    leg_duration_seconds=leg_duration_seconds,
                    leg_geometry=leg_geometry,
                )
            )

        trip_coords = trip.get("geometry", {}).get("coordinates", [])
        total_encoded_polyline = encode_polyline(trip_coords) if trip_coords else ""
        total_dist_meters = float(trip.get("distance", 0.0))
        total_duration_sec = int(float(trip.get("duration", 0.0)))

        return RouteCalculationResultDTO(
            total_distance_km=round(total_dist_meters / 1000.0, 3),
            total_duration_seconds=total_duration_sec,
            encoded_polyline=total_encoded_polyline,
            ordered_stops=tuple(ordered_stops),
        )

    def _calculate_fallback_route(self, request: RouteCalculationRequestDTO) -> RouteCalculationResultDTO:
        """Cálculo sintético basado en Haversine cuando OSRM no está accesible."""
        waypoints = list(request.waypoints)

        # Ordenamiento voraz por cercanía (Nearest Neighbor TSP) si se solicitó optimización
        if request.optimize_waypoint_order:
            ordered_wps: list[WaypointInputDTO] = []
            current_lat = request.start_latitude
            current_lon = request.start_longitude
            remaining = waypoints.copy()

            while remaining:
                nearest_idx = min(
                    range(len(remaining)),
                    key=lambda i: self._haversine(
                        current_lat, current_lon, remaining[i].latitude, remaining[i].longitude
                    ),
                )
                nearest = remaining.pop(nearest_idx)
                ordered_wps.append(nearest)
                current_lat = nearest.latitude
                current_lon = nearest.longitude
        else:
            ordered_wps = waypoints

        total_distance_km = 0.0
        total_duration_seconds = 0
        ordered_stops: list[OptimizedStopDTO] = []

        prev_lat = request.start_latitude
        prev_lon = request.start_longitude

        for i, wp in enumerate(ordered_wps):
            leg_km = self._haversine(prev_lat, prev_lon, wp.latitude, wp.longitude)
            # Estimación promedio urbana: 30 km/h
            leg_duration = max(30, int((leg_km / 30.0) * 3600))

            total_distance_km += leg_km
            total_duration_seconds += leg_duration

            coords = [
                [round(prev_lon, 6), round(prev_lat, 6)],
                [round(wp.longitude, 6), round(wp.latitude, 6)],
            ]
            leg_geometry = {
                "type": "LineString",
                "coordinates": coords,
                "distance_km": round(leg_km, 3),
                "duration_seconds": leg_duration,
                "polyline": encode_polyline(coords),
            }

            ordered_stops.append(
                OptimizedStopDTO(
                    codigo_fijo_id=wp.codigo_fijo_id,
                    order_index=i + 1,
                    latitude=wp.latitude,
                    longitude=wp.longitude,
                    leg_distance_km=round(leg_km, 3),
                    leg_duration_seconds=leg_duration,
                    leg_geometry=leg_geometry,
                )
            )

            prev_lat = wp.latitude
            prev_lon = wp.longitude

        all_trip_coords = [[round(request.start_longitude, 6), round(request.start_latitude, 6)]] + [
            [round(s.longitude, 6), round(s.latitude, 6)] for s in ordered_stops
        ]

        return RouteCalculationResultDTO(
            total_distance_km=round(total_distance_km, 3),
            total_duration_seconds=total_duration_seconds,
            encoded_polyline=encode_polyline(all_trip_coords),
            ordered_stops=tuple(ordered_stops),
        )

    @staticmethod
    def _haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        r = 6371.0  # Radio medio terrestre en km
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        a = (
            math.sin(dlat / 2.0) ** 2
            + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2.0) ** 2
        )
        c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
        return r * c
