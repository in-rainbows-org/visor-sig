from enum import Enum


class MapLayerLoadStatus(str, Enum):
    """Estado de disponibilidad o carga de datos de una capa en el visor."""

    READY = "READY"
    NO_ACTIVE_VERSION = "NO_ACTIVE_VERSION"
    ZOOM_REQUIRED = "ZOOM_REQUIRED"
    FEATURE_LIMIT_REACHED = "FEATURE_LIMIT_REACHED"
