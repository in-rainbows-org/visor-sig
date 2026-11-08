"""add_evidence_fields_to_assignment_stops

Revision ID: c5e8b2a19d44
Revises: a1b2c3d4e5f6
Create Date: 2026-11-08 17:15:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c5e8b2a19d44'
down_revision: Union[str, Sequence[str], None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema: add meter_reading, evidence_photo_url, and observation to assignment_stops."""
    op.add_column('assignment_stops', sa.Column('meter_reading', sa.String(length=50), nullable=True))
    op.add_column('assignment_stops', sa.Column('evidence_photo_url', sa.String(length=500), nullable=True))
    op.add_column('assignment_stops', sa.Column('observation', sa.Text(), nullable=True))


def downgrade() -> None:
    """Downgrade schema: remove evidence columns from assignment_stops."""
    op.drop_column('assignment_stops', 'observation')
    op.drop_column('assignment_stops', 'evidence_photo_url')
    op.drop_column('assignment_stops', 'meter_reading')
