import uuid
from typing import Optional

from geoalchemy2 import Geometry
from sqlalchemy import Column, ForeignKey, Index, Integer, String
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlmodel import Field

from app.shared.infrastructure.db.base_model import BaseModel


class ManzanaModel(BaseModel, table=True):
    """
    Modelo SQLModel para la tabla especializada 'manzanas'.
    """

    __tablename__ = "manzanas"
    __table_args__ = (
        Index("idx_manzanas_data_version_id", "data_version_id"),
        Index("idx_manzanas_geometry", "geometry", postgresql_using="gist"),
        Index("idx_manzanas_version_uv_block", "data_version_id", "uv", "block_number"),
        Index("idx_manzanas_version_uv_block_code", "data_version_id", "uv_block_code"),
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
    uv_block_code: Optional[str] = Field(
        default=None,
        sa_column=Column(String(20), nullable=True),
    )
    uv: Optional[str] = Field(
        default=None,
        sa_column=Column(String(15), nullable=True),
    )
    block_number: Optional[str] = Field(
        default=None,
        sa_column=Column(String(10), nullable=True),
    )
    geometry: str = Field(
        sa_column=Column(
            Geometry(geometry_type="MULTIPOLYGON", srid=4326, spatial_index=False),
            nullable=False,
        ),
    )
