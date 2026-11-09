from app.shared.domain.exceptions import (
    ConflictException,
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


class AssignmentOwnershipException(ValidationException):
    """La asignación no pertenece al técnico autenticado."""

    code = "ASSIGNMENT_NOT_OWNED"
    message = "La asignación indicada no pertenece al técnico autenticado."


class AssignmentDateMismatchException(ValidationException):
    """La asignación solo puede iniciarse en la fecha programada."""

    code = "ASSIGNMENT_DATE_MISMATCH"
    message = "La asignación solo puede iniciarse el día para el cual fue programada."


class TechnicianActiveAssignmentConflictException(ConflictException):
    """El técnico ya tiene una asignación activa en progreso."""

    code = "TECHNICIAN_HAS_ACTIVE_ASSIGNMENT"
    message = "El técnico ya cuenta con una asignación activa en progreso."


class InvalidAssignmentStatusTransitionException(ConflictException):
    """La asignación no se encuentra en estado apto para la transición solicitada."""

    code = "INVALID_ASSIGNMENT_STATUS_TRANSITION"
    message = "La asignación no se encuentra en estado apto para la transición solicitada."


class ActiveStopConflictException(ConflictException):
    """Ya existe una parada de la asignación en curso (en tránsito o arribada)."""

    code = "ACTIVE_STOP_CONFLICT"
    message = "Ya existe una parada en tránsito o arribada en esta asignación."


class InvalidStopStatusTransitionException(ConflictException):
    """La parada no se encuentra en el estado previo requerido para esta transición."""

    code = "INVALID_STOP_STATUS_TRANSITION"
    message = "La parada no se encuentra en el estado previo requerido para esta acción."


class MissingStopObservationException(ValidationException):
    """La observación es obligatoria cuando la parada concluye como fallida."""

    code = "MISSING_STOP_OBSERVATION"
    message = "Debe proporcionar una observación justificativa al marcar la parada como fallida."


class MissingMeterReadingException(ValidationException):
    """La lectura del medidor es obligatoria cuando la parada concluye como exitosa."""

    code = "MISSING_METER_READING"
    message = "Debe proporcionar la lectura del medidor al marcar la parada como exitosa."


class MissingEvidencePhotoException(ValidationException):
    """La fotografía de evidencia es obligatoria cuando la parada concluye como exitosa."""

    code = "MISSING_EVIDENCE_PHOTO"
    message = "Debe adjuntar la fotografía de evidencia al marcar la parada como exitosa."

