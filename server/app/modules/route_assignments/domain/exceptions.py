from app.shared.domain.exceptions import (
    DomainException,
    NotFoundException,
    ValidationException,
)


class AssignmentNotFoundException(NotFoundException):
    """La asignación de ruta solicitada no existe o fue dada de baja."""

    code = "ASSIGNMENT_NOT_FOUND"
    message = "La asignación no fue encontrada."


class StopNotFoundException(NotFoundException):
    """La parada solicitada no existe en la asignación."""

    code = "STOP_NOT_FOUND"
    message = "La parada no fue encontrada."


class InvalidTechnicianException(ValidationException):
    """El técnico especificado no existe o no cuenta con el rol TECHNICIAN."""

    code = "INVALID_TECHNICIAN"


class InvalidStopsCountException(ValidationException):
    """La cantidad de paradas de la ruta debe estar entre 1 y 10."""

    code = "INVALID_STOPS_COUNT"


class InvalidWaterStatusException(ValidationException):
    """Incompatibilidad entre el tipo de asignación y el estado del agua del predio."""

    code = "INVALID_WATER_STATUS"


class DuplicateStopException(ValidationException):
    """Un mismo código fijo aparece duplicado en la asignación."""

    code = "DUPLICATE_STOP"


class InvalidStopSequenceException(ValidationException):
    """La secuencia de visita (order_index) debe ser consecutiva del 1 al N."""

    code = "INVALID_STOP_SEQUENCE"


class OSRMRouteException(DomainException):
    """Fallo en el servicio externo de cálculo de rutas de OSRM."""

    code = "OSRM_ROUTES_ERROR"
    message = "No fue posible calcular la ruta vial a través de OSRM."


# Alias de compatibilidad
GoogleRoutesException = OSRMRouteException


class InvalidDateRangeException(ValidationException):
    """El rango de fechas debe incluir ambos extremos o ninguno."""

    code = "INVALID_DATE_RANGE"
    message = "Debe especificar tanto la fecha inicial como la fecha final del rango, o ambas deben omitirse."
