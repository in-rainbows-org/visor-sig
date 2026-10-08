class AuditLogError(Exception):
    """Excepción base del dominio de bitácora."""


class InvalidAuditLogError(AuditLogError):
    """Excepción cuando los datos de una entrada de bitácora no cumplen las invariantes."""
