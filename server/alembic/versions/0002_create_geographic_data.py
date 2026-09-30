"""create geographic data tables

Revision ID: 0002_create_geographic_data
Revises: 0001_create_layers
Create Date: 2026-09-27 16:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
import geoalchemy2

# revision identifiers, used by Alembic.
revision: str = '0002_create_geographic_data'
down_revision: Union[str, None] = '0001_create_layers'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Crear tabla data_versions
    op.create_table(
        'data_versions',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('layer_id', sa.UUID(), nullable=False),
        sa.Column('version_number', sa.Integer(), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False),
        sa.Column('source_filename', sa.String(length=255), nullable=False),
        sa.Column('feature_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('imported_by_user_id', sa.String(), nullable=True),
        sa.Column('created_date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('modified_date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('deleted_date', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['layer_id'], ['layers.id'], ondelete='RESTRICT'),
        sa.UniqueConstraint('layer_id', 'version_number', name='uq_data_versions_layer_version'),
        sa.CheckConstraint('version_number > 0', name='chk_data_version_number_positive'),
        sa.CheckConstraint('feature_count >= 0', name='chk_data_version_feature_count_non_negative'),
    )
    op.create_index('ix_data_versions_layer_id', 'data_versions', ['layer_id'], unique=False)
    op.create_index('ix_data_versions_layer_date', 'data_versions', ['layer_id', sa.text('created_date DESC')], unique=False)
    op.create_index('ix_data_versions_status', 'data_versions', ['status'], unique=False)

    # 2. Crear tabla geographic_features
    op.create_table(
        'geographic_features',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('data_version_id', sa.UUID(), nullable=False),
        sa.Column('source_feature_id', sa.String(length=120), nullable=True),
        sa.Column('geometry', geoalchemy2.types.Geometry(geometry_type='GEOMETRY', srid=4326, spatial_index=False), nullable=False),
        sa.Column('properties', postgresql.JSONB(astext_type=sa.Text()), server_default='{}', nullable=False),
        sa.Column('created_date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('modified_date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('deleted_date', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['data_version_id'], ['data_versions.id'], ondelete='RESTRICT'),
    )
    op.create_index('ix_geographic_features_data_version_id', 'geographic_features', ['data_version_id'], unique=False)
    op.create_index('idx_geographic_features_geometry', 'geographic_features', ['geometry'], postgresql_using='gist')

    # 3. Agregar FK active_data_version_id en tabla layers
    op.create_foreign_key(
        'fk_layers_active_data_version_id_data_versions',
        'layers',
        'data_versions',
        ['active_data_version_id'],
        ['id'],
        ondelete='SET NULL'
    )


def downgrade() -> None:
    # 1. Eliminar FK en layers
    op.drop_constraint('fk_layers_active_data_version_id_data_versions', 'layers', type_='foreignkey')

    # 2. Eliminar geographic_features
    op.drop_index('idx_geographic_features_geometry', table_name='geographic_features', postgresql_using='gist')
    op.drop_index('ix_geographic_features_data_version_id', table_name='geographic_features')
    op.drop_table('geographic_features')

    # 3. Eliminar data_versions
    op.drop_index('ix_data_versions_status', table_name='data_versions')
    op.drop_index('ix_data_versions_layer_date', table_name='data_versions')
    op.drop_index('ix_data_versions_layer_id', table_name='data_versions')
    op.drop_table('data_versions')
