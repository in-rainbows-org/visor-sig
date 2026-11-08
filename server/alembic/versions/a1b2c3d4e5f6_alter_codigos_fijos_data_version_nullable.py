"""alter_codigos_fijos_data_version_nullable

Revision ID: a1b2c3d4e5f6
Revises: f79f4b841e05
Create Date: 2026-11-08 01:15:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = 'f79f4b841e05'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema: make data_version_id nullable in codigos_fijos."""
    op.alter_column(
        'codigos_fijos',
        'data_version_id',
        existing_type=postgresql.UUID(as_uuid=True),
        nullable=True,
    )


def downgrade() -> None:
    """Downgrade schema: restore data_version_id not null."""
    op.alter_column(
        'codigos_fijos',
        'data_version_id',
        existing_type=postgresql.UUID(as_uuid=True),
        nullable=False,
    )
