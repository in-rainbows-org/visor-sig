from datetime import datetime
from typing import Any, Optional
import uuid

from sqlalchemy import Column, DateTime, ForeignKey, Index, Integer, JSON, SmallInteger, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlmodel import Field

from app.shared.infrastructure.db.base_model import BaseModel


class AssignmentStopModel(BaseModel, table=True):
    """Modelo SQLModel para la tabla 'assignment_stops' (Paradas planificadas y su trazado)."""

    __tablename__ = "assignment_stops"
    __table_args__ = (
        Index("idx_assignment_stops_assignment_id", "assignment_id"),
        Index("idx_assignment_stops_codigo_fijo_id", "codigo_fijo_id"),
        Index("idx_assignment_stops_assignment_order", "assignment_id", "order_index"),
        Index("idx_assignment_stops_deleted_date", "deleted_date"),
    )

    assignment_id: uuid.UUID = Field(
        sa_column=Column(
            PG_UUID(as_uuid=True),
            ForeignKey("assignments.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
    )
    codigo_fijo_id: uuid.UUID = Field(
        sa_column=Column(
            PG_UUID(as_uuid=True),
            ForeignKey("codigos_fijos.id", ondelete="RESTRICT"),
            nullable=False,
            index=True,
        ),
    )
    order_index: int = Field(
        sa_column=Column(Integer, nullable=False),
    )
    current_status: int = Field(
        sa_column=Column(SmallInteger, nullable=False),
    )
    target_status: int = Field(
        sa_column=Column(SmallInteger, nullable=False),
    )
    status: str = Field(
        default="PENDING",
        sa_column=Column(String(20), nullable=False, index=True),
    )
    route_geometry: dict[str, Any] = Field(
        default_factory=dict,
        sa_column=Column(
            JSONB().with_variant(JSON, "sqlite"),
            nullable=False,
            server_default="{}",
        ),
    )
    in_transit_at: Optional[datetime] = Field(
        default=None,
        sa_type=DateTime(timezone=True),
        nullable=True,
    )
    arrived_at: Optional[datetime] = Field(
        default=None,
        sa_type=DateTime(timezone=True),
        nullable=True,
    )
    completed_at: Optional[datetime] = Field(
        default=None,
        sa_type=DateTime(timezone=True),
        nullable=True,
    )
    meter_reading: Optional[str] = Field(
        default=None,
        sa_column=Column(String(50), nullable=True),
    )
    evidence_photo_url: Optional[str] = Field(
        default=None,
        sa_column=Column(String(500), nullable=True),
    )
    observation: Optional[str] = Field(
        default=None,
        sa_column=Column(Text, nullable=True),
    )

