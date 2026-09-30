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


class CodigoFijoStatus(IntEnum):
    NORMAL = 1
    PARA_CORTE = 2
    CORTADO = 3
    BAJA_PARCIAL = 4
    BAJA_TOTAL = 5


EstadoCodigoFijo = CodigoFijoStatus
