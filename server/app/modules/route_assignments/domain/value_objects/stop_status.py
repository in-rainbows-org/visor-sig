from enum import StrEnum


class StopStatus(StrEnum):
    """Estado operativo de la visita a una parada individual."""

    PENDING = "PENDING"
    IN_TRANSIT = "IN_TRANSIT"
    ARRIVED = "ARRIVED"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"

    def is_pending(self) -> bool:
        return self is StopStatus.PENDING

    def is_in_transit(self) -> bool:
        return self is StopStatus.IN_TRANSIT

    def is_arrived(self) -> bool:
        return self is StopStatus.ARRIVED

    def is_completed(self) -> bool:
        return self is StopStatus.COMPLETED

    def is_failed(self) -> bool:
        return self is StopStatus.FAILED

