import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import Column, DateTime
from sqlmodel import Field, SQLModel


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class BaseModel(SQLModel):
    """
    Modelo base de persistencia para SQLModel.
    Todas las tablas del sistema heredarán de aquí.

    Campos incluidos:
    - id            → UUID v4 generado automáticamente (PK)
    - created_date  → timestamp de creación (UTC con timezone)
    - modified_date → timestamp de última modificación (actualizado automáticamente en cada UPDATE)
    - deleted_date  → timestamp de eliminación lógica (nullable; disponibilidad derivada de IS NULL)
    """

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)

    created_date: datetime = Field(
        default_factory=utc_now,
        sa_type=DateTime(timezone=True),
        nullable=False,
    )
    modified_date: datetime = Field(
        default_factory=utc_now,
        sa_type=DateTime(timezone=True),
        sa_column_kwargs={"onupdate": utc_now},
        nullable=False,
    )
    deleted_date: Optional[datetime] = Field(
        default=None,
        sa_type=DateTime(timezone=True),
        nullable=True,
    )

    @property
    def is_deleted(self) -> bool:
        return self.deleted_date is not None

    def soft_delete(self) -> None:
        """Marca el registro como inactivo registrando la fecha de eliminación."""
        now = utc_now()
        self.deleted_date = now
        self.modified_date = now

    def restore(self) -> None:
        """Restaura un registro eliminado lógicamente limpiando la fecha de eliminación."""
        self.deleted_date = None
        self.modified_date = utc_now()
