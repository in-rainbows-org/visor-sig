from app.shared.infrastructure.db.base_model import BaseModel
from sqlalchemy import CheckConstraint, Column, String, UniqueConstraint
from sqlmodel import Field


class LayerModel(BaseModel, table=True):
    """
    Modelo de persistencia SQLModel para la tabla 'layers'.
    Hereda de BaseModel (id, created_date, modified_date, deleted_date).
    La disponibilidad activa se deriva exclusivamente de deleted_date IS NULL.
    """

    __tablename__ = "layers"
    __table_args__ = (
        UniqueConstraint("kind", name="uq_layers_kind"),
        CheckConstraint(
            "(kind = 'CODIGOS_FIJOS' AND name = 'Códigos Fijos' AND geometry_type = 'POINT') OR "
            "(kind = 'LOTES' AND name = 'Lotes' AND geometry_type = 'POLYGON') OR "
            "(kind = 'MANZANAS' AND name = 'Manzanas' AND geometry_type = 'POLYGON') OR "
            "(kind = 'VIAS' AND name = 'Vías' AND geometry_type = 'LINE')",
            name="ck_layers_kind_name_geom",
        ),
    )

    kind: str = Field(
        sa_column=Column(String(30), nullable=False, unique=True, index=True),
    )
    name: str = Field(
        sa_column=Column(String(120), nullable=False, index=True),
    )
    geometry_type: str = Field(
        sa_column=Column(String(20), nullable=False),
    )
    color: str = Field(
        sa_column=Column(String(20), nullable=False),
    )
