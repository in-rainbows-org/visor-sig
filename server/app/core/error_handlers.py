from fastapi import FastAPI
from app.core.errors.handlers import format_error, setup_exception_handlers
from app.core.errors.exceptions import APIHTTPException


class PayloadTooLargeError(APIHTTPException):
    def __init__(self, message: str = "El archivo excede el tamaño máximo permitido de 100 MB."):
        super().__init__(status_code=413, code="PAYLOAD_TOO_LARGE", message=message)


class UnsupportedMediaTypeError(APIHTTPException):
    def __init__(self, message: str = "Tipo de medio no soportado. Solo se permiten archivos ZIP."):
        super().__init__(status_code=415, code="UNSUPPORTED_MEDIA_TYPE", message=message)


def setup_error_handlers(app: FastAPI) -> None:
    """Configura los manejadores de errores globales en FastAPI."""
    setup_exception_handlers(app)


__all__ = [
    "format_error",
    "setup_error_handlers",
    "setup_exception_handlers",
    "PayloadTooLargeError",
    "UnsupportedMediaTypeError",
]
