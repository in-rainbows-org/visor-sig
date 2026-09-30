import uuid
from typing import Optional

from geoalchemy2 import Geometry
from sqlalchemy import Column, ForeignKey, Index, Integer, String
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlmodel import Field

from app.shared.infrastructure.db.base_model import BaseModel


class LoteModel(BaseModel, table=True):
    """
    Modelo SQLModel para la tabla especializada 'lotes'.
    """

    __tablename__ = "lotes"
    __table_args__ = (
        Index("idx_lotes_data_version_id", "data_version_id"),
        Index("idx_lotes_geometry", "geometry", postgresql_using="gist"),
        Index("idx_lotes_version_lot_number", "data_version_id", "lot_number"),
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
    source_id: Optional[int] = Field(
        default=None,
        sa_column=Column(Integer, nullable=True),
    )
    lot_number: Optional[str] = Field(
        default=None,
        sa_column=Column(String(15), nullable=True),
    )
    geometry: str = Field(
        sa_column=Column(
            Geometry(geometry_type="MULTIPOLYGON", srid=4326, spatial_index=False),
            nullable=False,
        ),
    )
