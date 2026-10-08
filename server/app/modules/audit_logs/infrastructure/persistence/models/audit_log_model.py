from sqlalchemy import Column, Index, String, Text
from sqlmodel import Field

from app.shared.infrastructure.db.base_model import BaseModel


class AuditLogModel(BaseModel, table=True):
    """
    Modelo de persistencia SQLModel para la tabla 'audit_logs'.
    Hereda de BaseModel (id, created_date, modified_date, deleted_date).
    Registros de bitácora son inmutables de solo anexado.
    """

    __tablename__ = "audit_logs"
    __table_args__ = (
        Index("idx_audit_logs_created_date_desc", "created_date"),
        Index("idx_audit_logs_user_id", "user_id"),
        Index("idx_audit_logs_action", "action"),
    )

    user_id: str = Field(
        sa_column=Column(String(255), nullable=False, index=True),
    )
    action: str = Field(
        sa_column=Column(String(20), nullable=False, index=True),
    )
    description: str = Field(
        sa_column=Column(Text, nullable=False),
    )
