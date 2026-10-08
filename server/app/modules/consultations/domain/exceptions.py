from app.shared.domain.exceptions import NotFoundException, ValidationException


class ConsultationLayerNotFoundException(NotFoundException):
    """La capa solicitada no existe o ha sido dada de baja en el catálogo."""

    code = "CONSULTATION_LAYER_NOT_FOUND"

    def __init__(self, layer_kind: str) -> None:
        super().__init__(
            message=f"La capa '{layer_kind}' no existe o ha sido eliminada.",
            code=self.code,
        )


class LayerHasNoActiveVersionException(ValidationException):
    """La capa no cuenta con una versión de datos activa para ejecutar consultas."""

    code = "LAYER_HAS_NO_ACTIVE_VERSION"

    def __init__(self, layer_kind: str) -> None:
        super().__init__(
            message=f"La capa '{layer_kind}' no posee una versión de datos activa para consultar.",
            code=self.code,
        )


class InvalidConsultationPaginationException(ValidationException):
    """Los parámetros de paginación proporcionados no son válidos."""

    code = "INVALID_CONSULTATION_PAGINATION"

    def __init__(self, message: str = "Parámetros de paginación inválidos.") -> None:
        super().__init__(
            message=message,
            code=self.code,
        )
