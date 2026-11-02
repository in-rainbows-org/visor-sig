from abc import ABC, abstractmethod

from app.modules.route_assignments.application.dtos.route_dtos import (
    RouteCalculationRequestDTO,
    RouteCalculationResultDTO,
)


class RouteCalculatorProvider(ABC):
    """Puerto de integración para proveedores externos de cálculo y optimización de rutas viales."""

    @abstractmethod
    def calculate_route(self, request: RouteCalculationRequestDTO) -> RouteCalculationResultDTO:
        """Calcula la ruta vial óptima entre el origen y las paradas ordenadas."""
