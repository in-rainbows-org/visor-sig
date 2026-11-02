from enum import StrEnum


class AssignmentType(StrEnum):
    """Tipo de labor operativa a ejecutar en la asignación."""

    CUT = "CUT"
    RECONNECTION = "RECONNECTION"

    def is_cut(self) -> bool:
        return self is AssignmentType.CUT

    def is_reconnection(self) -> bool:
        return self is AssignmentType.RECONNECTION
