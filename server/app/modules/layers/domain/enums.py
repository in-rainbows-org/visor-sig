from enum import IntEnum, StrEnum


class LayerKind(StrEnum):
    CODIGOS_FIJOS = "CODIGOS_FIJOS"
    LOTES = "LOTES"
    MANZANAS = "MANZANAS"
    VIAS = "VIAS"


class GeometryType(StrEnum):
    POINT = "POINT"
    LINE = "LINE"
    POLYGON = "POLYGON"


class LayerColor(StrEnum):
    BLUE = "BLUE"
    ORANGE = "ORANGE"
    GREEN = "GREEN"
    VIOLET = "VIOLET"
    RED = "RED"
    LIGHT_BLUE = "LIGHT_BLUE"
    YELLOW = "YELLOW"


class DataVersionStatus(StrEnum):
    PROCESSING = "PROCESSING"
    READY = "READY"
    FAILED = "FAILED"

    def is_ready(self) -> bool:
        return self is DataVersionStatus.READY

    def is_processing(self) -> bool:
        return self is DataVersionStatus.PROCESSING

    def is_failed(self) -> bool:
        return self is DataVersionStatus.FAILED


class CodigoFijoStatus(IntEnum):
    NORMAL = 1
    PARA_CORTE = 2
    CORTADO = 3
    BAJA_PARCIAL = 4
    BAJA_TOTAL = 5


EstadoCodigoFijo = CodigoFijoStatus
