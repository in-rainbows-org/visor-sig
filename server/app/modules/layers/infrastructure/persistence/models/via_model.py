import uuid
from typing import Optional

from geoalchemy2 import Geometry
from sqlalchemy import BigInteger, Boolean, Column, ForeignKey, Index, Integer, String
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlmodel import Field

from app.shared.infrastructure.db.base_model import BaseModel


class ViaModel(BaseModel, table=True):
    """
    Modelo SQLModel para la tabla especializada 'vias'.
    """

    __tablename__ = "vias"
    __table_args__ = (
        Index("idx_vias_data_version_id", "data_version_id"),
        Index("idx_vias_geometry", "geometry", postgresql_using="gist"),
        Index("idx_vias_version_osm_id", "data_version_id", "osm_id"),
        Index("idx_vias_version_name", "data_version_id", "name"),
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
    osm_id: Optional[int] = Field(
        default=None,
        sa_column=Column(BigInteger, nullable=True),
    )
    name: Optional[str] = Field(
        default=None,
        sa_column=Column(String(48), nullable=True),
    )
    reference: Optional[str] = Field(
        default=None,
        sa_column=Column(String(16), nullable=True),
    )
    road_type: Optional[str] = Field(
        default=None,
        sa_column=Column(String(16), nullable=True),
    )
    is_one_way: Optional[bool] = Field(
        default=None,
        sa_column=Column(Boolean, nullable=True),
    )
    is_bridge: Optional[bool] = Field(
        default=None,
        sa_column=Column(Boolean, nullable=True),
    )
    max_speed: Optional[int] = Field(
        default=None,
        sa_column=Column(Integer, nullable=True),
    )
    object_id: Optional[int] = Field(
        default=None,
        sa_column=Column(BigInteger, nullable=True),
    )
    legacy_name: Optional[str] = Field(
        default=None,
        sa_column=Column(String(40), nullable=True),
    )
    legacy_osm_id: Optional[int] = Field(
        default=None,
        sa_column=Column(BigInteger, nullable=True),
    )
    highway_code: Optional[int] = Field(
        default=None,
        sa_column=Column(BigInteger, nullable=True),
    )
    geometry: str = Field(
        sa_column=Column(
            Geometry(geometry_type="MULTILINESTRING", srid=4326, spatial_index=False),
            nullable=False,
        ),
    )
