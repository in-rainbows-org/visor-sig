from enum import StrEnum


class AssignmentStatus(StrEnum):
    """Estado del ciclo de vida operativo de una asignación de ruta."""

    ASSIGNED = "ASSIGNED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"

    def is_assigned(self) -> bool:
        return self is AssignmentStatus.ASSIGNED

    def is_in_progress(self) -> bool:
        return self is AssignmentStatus.IN_PROGRESS

    def is_completed(self) -> bool:
        return self is AssignmentStatus.COMPLETED
