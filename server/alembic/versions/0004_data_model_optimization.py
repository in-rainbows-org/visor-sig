"""Data model optimization: decouple layers and data_versions, add cadastral relationships and properties JSONB

Revision ID: 0004_data_model_optimization
Revises: 0003_static_typed_datasets
Create Date: 2026-10-04 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '0004_data_model_optimization'
down_revision: Union[str, None] = '0003_static_typed_datasets'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. En data_versions: agregar is_active
    op.add_column(
        'data_versions',
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('false')),
    )

    # 2. Migrar los estados activos actuales desde layers hacia data_versions
    op.execute(
        """
        UPDATE data_versions
           SET is_active = true
         WHERE id IN (
             SELECT active_data_version_id
               FROM layers
              WHERE active_data_version_id IS NOT NULL
         )
        """
    )

    # 3. Crear índice único parcial en data_versions (máximo 1 versión activa por capa no eliminada)
    op.create_index(
        'uq_data_versions_active_layer',
        'data_versions',
        ['layer_id'],
        unique=True,
        postgresql_where=sa.text('is_active = true AND deleted_date IS NULL'),
    )

    # 4. En layers: eliminar FK circular y la columna active_data_version_id
    op.drop_constraint(
        'fk_layers_active_data_version_id_data_versions',
        'layers',
        type_='foreignkey',
    )
    op.drop_column('layers', 'active_data_version_id')

    # 5. En manzanas: agregar properties JSONB
    op.add_column(
        'manzanas',
        sa.Column(
            'properties',
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'{}'::jsonb"),
        ),
    )

    # 6. En lotes: agregar manzana_id (FK e índice) y properties JSONB
    op.add_column('lotes', sa.Column('manzana_id', sa.UUID(), nullable=True))
    op.create_foreign_key(
        'fk_lotes_manzana_id_manzanas',
        'lotes',
        'manzanas',
        ['manzana_id'],
        ['id'],
        ondelete='SET NULL',
    )
    op.create_index('idx_lotes_manzana_id', 'lotes', ['manzana_id'])
    op.add_column(
        'lotes',
        sa.Column(
            'properties',
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'{}'::jsonb"),
        ),
    )

    # 7. En codigos_fijos: agregar lote_id (FK e índice) y properties JSONB
    op.add_column('codigos_fijos', sa.Column('lote_id', sa.UUID(), nullable=True))
    op.create_foreign_key(
        'fk_codigos_fijos_lote_id_lotes',
        'codigos_fijos',
        'lotes',
        ['lote_id'],
        ['id'],
        ondelete='SET NULL',
    )
    op.create_index('idx_codigos_fijos_lote_id', 'codigos_fijos', ['lote_id'])
    op.add_column(
        'codigos_fijos',
        sa.Column(
            'properties',
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'{}'::jsonb"),
        ),
    )

    # 8. En vias: agregar properties JSONB
    op.add_column(
        'vias',
        sa.Column(
            'properties',
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'{}'::jsonb"),
        ),
    )


def downgrade() -> None:
    # 8. Revertir vias properties
    op.drop_column('vias', 'properties')

    # 7. Revertir codigos_fijos lote_id y properties
    op.drop_column('codigos_fijos', 'properties')
    op.drop_index('idx_codigos_fijos_lote_id', table_name='codigos_fijos')
    op.drop_constraint('fk_codigos_fijos_lote_id_lotes', 'codigos_fijos', type_='foreignkey')
    op.drop_column('codigos_fijos', 'lote_id')

    # 6. Revertir lotes manzana_id y properties
    op.drop_column('lotes', 'properties')
    op.drop_index('idx_lotes_manzana_id', table_name='lotes')
    op.drop_constraint('fk_lotes_manzana_id_manzanas', 'lotes', type_='foreignkey')
    op.drop_column('lotes', 'manzana_id')

    # 5. Revertir manzanas properties
    op.drop_column('manzanas', 'properties')

    # 4. Restaurar active_data_version_id en layers
    op.add_column('layers', sa.Column('active_data_version_id', sa.UUID(), nullable=True))
    op.create_foreign_key(
        'fk_layers_active_data_version_id_data_versions',
        'layers',
        'data_versions',
        ['active_data_version_id'],
        ['id'],
        ondelete='SET NULL',
    )

    # Restaurar los valores en layers desde data_versions activas
    op.execute(
        """
        UPDATE layers l
           SET active_data_version_id = dv.id
          FROM data_versions dv
         WHERE dv.layer_id = l.id
           AND dv.is_active = true
           AND dv.deleted_date IS NULL
        """
    )

    # 3. Eliminar índice uq_data_versions_active_layer
    op.drop_index('uq_data_versions_active_layer', table_name='data_versions')

    # 1. Eliminar columna is_active en data_versions
    op.drop_column('data_versions', 'is_active')
