from dataclasses import dataclass

from app.shared.domain.domain_event import DomainEvent


@dataclass(frozen=True, kw_only=True)
class ConsultationPerformedEvent(DomainEvent):
    """
    Evento de dominio emitido cuando un usuario ejecuta exitosamente una consulta alfanumérica.
    """

    user_id: str
    layer_name: str
    filter_type: str
    query_value: str
