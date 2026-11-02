from app.modules.route_assignments.application.dtos.route_dtos import (
    RouteCalculationRequestDTO,
    RouteCalculationResultDTO,
)
from app.modules.route_assignments.application.ports.providers.route_calculator_provider import (
    RouteCalculatorProvider,
)
from app.modules.route_assignments.domain.exceptions import (
    DuplicateStopException,
    InvalidStopsCountException,
)


class CalculateRouteUseCase:
    """Caso de uso para cálculo, optimización y previsualización de rutas viales."""

    def __init__(self, provider: RouteCalculatorProvider) -> None:
        self.provider = provider

    def execute(self, request: RouteCalculationRequestDTO) -> RouteCalculationResultDTO:
        self._validate_stops_count(len(request.waypoints))
        self._validate_unique_stops(request)
        return self.provider.calculate_route(request)

    @staticmethod
    def _validate_stops_count(count: int) -> None:
        if count < 1 or count > 10:
            raise InvalidStopsCountException(
                f"La cantidad de paradas debe estar entre 1 y 10 (recibidas: {count})."
            )

    @staticmethod
    def _validate_unique_stops(request: RouteCalculationRequestDTO) -> None:
        seen = set()
        for wp in request.waypoints:
            if wp.codigo_fijo_id in seen:
                raise DuplicateStopException(
                    f"El código fijo '{wp.codigo_fijo_id}' aparece más de una vez en las paradas enviadas."
                )
            seen.add(wp.codigo_fijo_id)
