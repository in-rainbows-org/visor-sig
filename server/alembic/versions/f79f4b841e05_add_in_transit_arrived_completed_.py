"""add_in_transit_arrived_completed_timestamps_to_assignment_stops

Revision ID: f79f4b841e05
Revises: bf61136995a3
Create Date: 2026-11-07 22:41:26.230603

"""
from typing import Sequence, Union
import sqlmodel
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f79f4b841e05'
down_revision: Union[str, Sequence[str], None] = 'bf61136995a3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('assignment_stops', sa.Column('in_transit_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('assignment_stops', sa.Column('arrived_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('assignment_stops', sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('assignment_stops', 'completed_at')
    op.drop_column('assignment_stops', 'arrived_at')
    op.drop_column('assignment_stops', 'in_transit_at')

