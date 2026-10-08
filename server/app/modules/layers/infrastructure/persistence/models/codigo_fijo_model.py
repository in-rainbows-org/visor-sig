import uuid
from datetime import datetime, timezone

from app.shared.infrastructure.db.base_model import BaseModel
from geoalchemy2 import Geometry
from sqlalchemy import (
    BigInteger,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Index,
    SmallInteger,
    String,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlmodel import Field


class CodigoFijoModel(BaseModel, table=True):
    """
    Modelo SQLModel para la tabla especializada 'codigos_fijos'.
    """

    __tablename__ = "codigos_fijos"
    __table_args__ = (
        Index("idx_codigos_fijos_data_version_id", "data_version_id"),
        Index("idx_codigos_fijos_geometry", "geometry", postgresql_using="gist"),
        Index("idx_codigos_fijos_version_fixed_code", "data_version_id", "fixed_code"),
        Index("idx_codigos_fijos_version_sql_code", "data_version_id", "sql_code"),
        Index("idx_codigos_fijos_version_status", "data_version_id", "status"),
        Index("idx_codigos_fijos_lote_id", "lote_id"),
        Index("idx_codigos_fijos_name", "name"),
    )

    data_version_id: uuid.UUID = Field(
        sa_column=Column(
            PG_UUID(as_uuid=True),
            ForeignKey("data_versions.id", ondelete="CASCADE"),
            nullable=False,
        ),
    )
    lote_id: uuid.UUID | None = Field(
        default=None,
        sa_column=Column(
            PG_UUID(as_uuid=True),
            ForeignKey("lotes.id", ondelete="SET NULL"),
            nullable=True,
            index=True,
        ),
    )
    source_feature_id: str | None = Field(
        default=None,
        sa_column=Column(String(120), nullable=True),
    )
    label: str | None = Field(
        default=None,
        sa_column=Column(String(254), nullable=True),
    )
    sql_code: int | None = Field(
        default=None,
        sa_column=Column(BigInteger, nullable=True),
    )
    sig_code: str | None = Field(
        default=None,
        sa_column=Column(String(25), nullable=True),
    )
    fixed_code: int | None = Field(
        default=None,
        sa_column=Column(BigInteger, nullable=True),
    )
    name: str | None = Field(
        default=None,
        sa_column=Column(String(120), nullable=True),
    )
    longitude: float = Field(
        sa_column=Column(Float, nullable=False),
    )
    latitude: float = Field(
        sa_column=Column(Float, nullable=False),
    )
    status: int = Field(
        default=1,
        sa_column=Column(SmallInteger, nullable=False, default=1),
    )
    status_changed_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True), nullable=False),
    )
    geometry: str = Field(
        sa_column=Column(
            Geometry(geometry_type="MULTIPOINT", srid=4326, spatial_index=False),
            nullable=False,
        ),
    )
    properties: dict = Field(
        default_factory=dict,
        sa_column=Column(JSONB, nullable=False, server_default="{}"),
    )
