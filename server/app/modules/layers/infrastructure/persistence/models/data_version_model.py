import uuid

from app.shared.infrastructure.db.base_model import BaseModel
from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Column,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlmodel import Field


class DataVersionModel(BaseModel, table=True):
    """
    Modelo de persistencia para la tabla 'data_versions'.
    Registra el historial de importaciones para cada capa.
    """

    __tablename__ = "data_versions"
    __table_args__ = (
        UniqueConstraint("layer_id", "version_number", name="uq_data_versions_layer_version"),
        CheckConstraint("version_number > 0", name="chk_data_version_number_positive"),
        CheckConstraint("feature_count >= 0", name="chk_data_version_feature_count_non_negative"),
    )

    layer_id: uuid.UUID = Field(
        sa_column=Column(
            PG_UUID(as_uuid=True),
            ForeignKey("layers.id", ondelete="RESTRICT"),
            nullable=False,
            index=True,
        ),
    )
    version_number: int = Field(
        sa_column=Column(Integer, nullable=False),
    )
    status: str = Field(
        sa_column=Column(String(20), nullable=False, index=True),
    )
    is_active: bool = Field(
        default=False,
        sa_column=Column(Boolean, nullable=False, default=False),
    )
    source_filename: str = Field(
        sa_column=Column(String(255), nullable=False),
    )
    feature_count: int = Field(
        default=0,
        sa_column=Column(Integer, nullable=False, default=0),
    )
    error_message: str | None = Field(
        default=None,
        sa_column=Column(Text, nullable=True),
    )
    imported_by_user_id: str | None = Field(
        default=None,
        sa_column=Column(String, nullable=True),
    )
