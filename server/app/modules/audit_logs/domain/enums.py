from enum import Enum


class ActionType(str, Enum):
    """
    Tipos de acciones auditables registradas en la bitácora del sistema.
    """

    LOGIN = "LOGIN"
    LOGOUT = "LOGOUT"
    SEARCH = "SEARCH"
    CREATE = "CREATE"
    UPDATE = "UPDATE"
    DELETE = "DELETE"
