from app.shared.domain.exceptions import NotFoundException, ValidationException


class ConsultationLayerNotFoundException(NotFoundException):
    def __init__(self, layer_kind: str):
        super().__init__(
            message=f"La capa '{layer_kind}' no existe o ha sido eliminada.",
            code="CONSULTATION_LAYER_NOT_FOUND",
        )


class LayerHasNoActiveVersionException(ValidationException):
    def __init__(self, layer_kind: str):
        super().__init__(
            message=f"La capa '{layer_kind}' no posee una versión de datos activa para consultar.",
            code="LAYER_HAS_NO_ACTIVE_VERSION",
        )


class InvalidConsultationFieldException(ValidationException):
    def __init__(self, field: str, layer_kind: str):
        super().__init__(
            message=f"El campo '{field}' no es un campo válido para consultar en la capa '{layer_kind}'.",
            code="INVALID_CONSULTATION_FIELD",
        )
