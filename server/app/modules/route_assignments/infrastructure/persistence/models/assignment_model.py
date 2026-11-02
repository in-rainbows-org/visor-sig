from datetime import date, datetime
from typing import Optional

from sqlalchemy import Column, DateTime, Float, Index, Integer, String
from sqlmodel import Field

from app.shared.infrastructure.db.base_model import BaseModel
from app.shared.infrastructure.db.better_auth import BetterAuthUser


class AssignmentModel(BaseModel, table=True):
    """Modelo SQLModel para la tabla 'assignments' (Cabecera de ruta de trabajo)."""

    __tablename__ = "assignments"
    __table_args__ = (
        Index("idx_assignments_technician_id", "technician_id"),
        Index("idx_assignments_status", "status"),
        Index("idx_assignments_scheduled_date", "scheduled_date"),
        Index("idx_assignments_deleted_date", "deleted_date"),
    )

    technician_id: str = Field(
        foreign_key="user.id",
        nullable=False,
        index=True,
    )
    status: str = Field(
        default="ASSIGNED",
        sa_column=Column(String(30), nullable=False, index=True),
    )
    assignment_type: str = Field(
        sa_column=Column(String(30), nullable=False, index=True),
    )
    scheduled_date: date = Field(
        nullable=False,
        index=True,
    )
    start_latitude: float = Field(
        sa_column=Column(Float, nullable=False),
    )
    start_longitude: float = Field(
        sa_column=Column(Float, nullable=False),
    )
    total_stops: int = Field(
        default=0,
        sa_column=Column(Integer, nullable=False),
    )
    total_distance_km: float = Field(
        default=0.0,
        sa_column=Column(Float, nullable=False),
    )
    started_at: Optional[datetime] = Field(
        default=None,
        sa_type=DateTime(timezone=True),
        nullable=True,
    )
    completed_at: Optional[datetime] = Field(
        default=None,
        sa_type=DateTime(timezone=True),
        nullable=True,
    )
