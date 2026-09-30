import uuid
from datetime import datetime, timezone
from typing import Optional

from geoalchemy2 import Geometry
from sqlalchemy import BigInteger, Column, DateTime, Float, ForeignKey, Index, SmallInteger, String
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlmodel import Field

from app.shared.infrastructure.db.base_model import BaseModel


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
    )

    data_version_id: uuid.UUID = Field(
        sa_column=Column(
            PG_UUID(as_uuid=True),
            ForeignKey("data_versions.id", ondelete="CASCADE"),
            nullable=False,
        ),
    )
    source_feature_id: Optional[str] = Field(
        default=None,
        sa_column=Column(String(120), nullable=True),
    )
    label: Optional[str] = Field(
        default=None,
        sa_column=Column(String(254), nullable=True),
    )
    sql_code: Optional[int] = Field(
        default=None,
        sa_column=Column(BigInteger, nullable=True),
    )
    sig_code: Optional[str] = Field(
        default=None,
        sa_column=Column(String(25), nullable=True),
    )
    fixed_code: Optional[int] = Field(
        default=None,
        sa_column=Column(BigInteger, nullable=True),
    )
    name: Optional[str] = Field(
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
