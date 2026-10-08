import uuid

from app.shared.domain.exceptions import (
    ConflictException,
    NotFoundException,
    ValidationException,
)


class LayerNotFoundException(NotFoundException):
    def __init__(self, layer_id: uuid.UUID | str):
        super().__init__(
            message=f"La capa con ID '{layer_id}' no existe o ha sido eliminada.",
            code="LAYER_NOT_FOUND",
        )


class LayerNameConflictException(ConflictException):
    def __init__(self, name: str):
        super().__init__(
            message=f"Ya existe una capa activa con el nombre '{name}'.",
            code="LAYER_NAME_CONFLICT",
        )


class InvalidLayerNameException(ValidationException):
    def __init__(self, message: str = "El nombre de la capa debe tener entre 1 y 120 caracteres."):
        super().__init__(message=message, code="INVALID_LAYER_NAME")


class LayerGeometryLockedException(ConflictException):
    def __init__(self, message: str = "No se puede cambiar el tipo de geometría de una capa que ya posee versiones de datos."):
        super().__init__(message=message, code="LAYER_GEOMETRY_LOCKED")


class InvalidDataVersionAssignmentException(ConflictException):
    def __init__(self, message: str = "Solo se puede asignar como activa una versión de datos en estado READY perteneciente a la misma capa."):
        super().__init__(message=message, code="INVALID_DATA_VERSION_ASSIGNMENT")


class LayerDisabledConflictException(ConflictException):
    def __init__(self, message: str = "No se pueden importar datos ni operar sobre una capa desactivada."):
        super().__init__(message=message, code="LAYER_DISABLED_CONFLICT")


class DataVersionNotFoundException(NotFoundException):
    def __init__(self, version_id: uuid.UUID | str):
        super().__init__(
            message=f"La versión de datos con ID '{version_id}' no existe.",
            code="DATA_VERSION_NOT_FOUND",
        )


class InvalidDataVersionStatusException(ConflictException):
    def __init__(self, message: str = "El estado actual de la versión de datos no permite la transición solicitada."):
        super().__init__(message=message, code="INVALID_DATA_VERSION_STATUS")


class InvalidShapefilePackageException(ValidationException):
    def __init__(self, message: str = "El archivo ZIP no contiene un conjunto de Shapefile válido (.shp, .shx, .dbf, .prj)."):
        super().__init__(message=message, code="INVALID_SHAPEFILE_PACKAGE")


class IncompatibleGeometryTypeException(ValidationException):
    def __init__(self, message: str = "La geometría de las entidades no coincide con el tipo de geometría configurado en la capa."):
        super().__init__(message=message, code="INCOMPATIBLE_GEOMETRY_TYPE")


class InvalidCoordinateReferenceSystemException(ValidationException):
    def __init__(self, message: str = "El sistema de referencia espacial (CRS) debe ser EPSG:4326 (WGS84)."):
        super().__init__(message=message, code="INVALID_CRS")
