"""create layers table

Revision ID: 0001_create_layers
Revises: 
Create Date: 2026-09-27 16:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '0001_create_layers'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Asegurar extensión PostGIS
    op.execute("CREATE EXTENSION IF NOT EXISTS postgis;")

    # Crear tabla layers
    op.create_table(
        'layers',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('name', sa.String(length=120), nullable=False),
        sa.Column('geometry_type', sa.String(length=20), nullable=False),
        sa.Column('color', sa.String(length=20), nullable=False),
        sa.Column('active_data_version_id', sa.UUID(), nullable=True),
        sa.Column('created_date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('modified_date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('deleted_date', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )

    # Índice para nombre y fecha
    op.create_index('ix_layers_name', 'layers', ['name'], unique=False)
    
    # Índice único parcial en lower(name) donde deleted_date IS NULL
    op.execute(
        "CREATE UNIQUE INDEX uq_layers_active_lower_name ON layers (lower(name)) WHERE deleted_date IS NULL;"
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS uq_layers_active_lower_name;")
    op.drop_index('ix_layers_name', table_name='layers')
    op.drop_table('layers')
