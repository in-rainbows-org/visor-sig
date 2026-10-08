from dataclasses import dataclass

from app.shared.domain.domain_event import DomainEvent


@dataclass(frozen=True, kw_only=True)
class GeographicDataImportedEvent(DomainEvent):
    """
    Evento de dominio emitido cuando se importa exitosamente un conjunto de datos para una capa.
    """

    user_id: str
    layer_name: str
    record_count: int


@dataclass(frozen=True, kw_only=True)
class DataVersionActivatedEvent(DomainEvent):
    """
    Evento de dominio emitido cuando se activa una versión de datos de una capa.
    """

    user_id: str
    layer_name: str
    version_number: int


@dataclass(frozen=True, kw_only=True)
class LayerColorChangedEvent(DomainEvent):
    """
    Evento de dominio emitido cuando se actualiza el color asignado a una capa.
    """

    user_id: str
    layer_name: str
    new_color: str
