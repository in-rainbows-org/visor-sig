"""static typed geographic datasets and 4 fixed layers

Revision ID: 0003_static_typed_geographic_datasets
Revises: 0002_create_geographic_data
Create Date: 2026-09-27 20:30:00.000000

NOTE: Downgrade reconstructs the previous table structure but CANNOT
recover data deleted from geographic_features or data_versions. A database
backup is required prior to applying this migration.
"""
from typing import Sequence, Union
import unicodedata

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
import geoalchemy2

# revision identifiers, used by Alembic.
revision: str = '0003_static_typed_datasets'
down_revision: Union[str, None] = '0002_create_geographic_data'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _normalize_name(name: str) -> str:
    nfkd = unicodedata.normalize('NFKD', name)
    ascii_str = ''.join([c for c in nfkd if not unicodedata.combining(c)]).lower().strip()
    return ascii_str.replace('-', '_').replace(' ', '_')


def upgrade() -> None:
    bind = op.get_bind()

    # 1. Preflight check: verificar catálogo existente
    conn = bind
    result = conn.execute(sa.text("SELECT id, name, geometry_type, color FROM layers WHERE deleted_date IS NULL"))
    rows = result.fetchall()

    kind_map = {
        'codigos_fijos': ('CODIGOS_FIJOS', 'Códigos Fijos', 'POINT'),
        'lotes': ('LOTES', 'Lotes', 'POLYGON'),
        'manzanas': ('MANZANAS', 'Manzanas', 'POLYGON'),
        'vias': ('VIAS', 'Vías', 'LINE'),
    }

    matched_kinds = {}
    for row in rows:
        norm = _normalize_name(row[1])
        if norm in kind_map:
            kind_enum, canonical_name, expected_geom = kind_map[norm]
            if kind_enum in matched_kinds:
                raise RuntimeError(f"Preflight falló: Capa duplicada para kind '{kind_enum}'.")
            matched_kinds[kind_enum] = (row[0], canonical_name, expected_geom)
        else:
            raise RuntimeError(f"Preflight falló: Capa desconocida '{row[1]}' encontrada en la base de datos.")

    if len(matched_kinds) != 4:
        missing = set(kind_map.keys()) - set(matched_kinds.keys())
        raise RuntimeError(
            f"Preflight falló: Se requieren exactamente 4 capas oficiales, pero faltan: {missing}. Capas encontradas: {[r[1] for r in rows]}"
        )

    # 2. Agregar columna kind (inicialmente nullable)
    op.add_column('layers', sa.Column('kind', sa.String(length=30), nullable=True))

    # 3. Backfill kind y normalización de nombres canónicos
    for kind_enum, (layer_id, canonical_name, expected_geom) in matched_kinds.items():
        conn.execute(
            sa.text(
                "UPDATE layers SET kind = :kind, name = :canonical_name, geometry_type = :geom WHERE id = :id"
            ),
            {"kind": kind_enum, "canonical_name": canonical_name, "geom": expected_geom, "id": layer_id}
        )

    # 4. Establecer kind NOT NULL
    op.alter_column('layers', 'kind', nullable=False)

    # 5. Restricción UNIQUE en kind y CHECK kind ↔ name ↔ geometry_type
    op.create_unique_constraint('uq_layers_kind', 'layers', ['kind'])
    op.create_check_constraint(
        'ck_layers_kind_name_geom',
        'layers',
        "(kind = 'CODIGOS_FIJOS' AND name = 'Códigos Fijos' AND geometry_type = 'POINT') OR "
        "(kind = 'LOTES' AND name = 'Lotes' AND geometry_type = 'POLYGON') OR "
        "(kind = 'MANZANAS' AND name = 'Manzanas' AND geometry_type = 'POLYGON') OR "
        "(kind = 'VIAS' AND name = 'Vías' AND geometry_type = 'LINE')"
    )

    # 6. Nullificar active_data_version_id y limpiar filas previas
    conn.execute(sa.text("UPDATE layers SET active_data_version_id = NULL"))
    conn.execute(sa.text("DELETE FROM geographic_features"))
    conn.execute(sa.text("DELETE FROM data_versions"))

    # 7. Crear tabla especializada codigos_fijos
    op.create_table(
        'codigos_fijos',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('data_version_id', sa.UUID(), nullable=False),
        sa.Column('source_feature_id', sa.String(length=120), nullable=True),
        sa.Column('label', sa.String(length=254), nullable=True),
        sa.Column('sql_code', sa.BigInteger(), nullable=True),
        sa.Column('sig_code', sa.String(length=25), nullable=True),
        sa.Column('fixed_code', sa.BigInteger(), nullable=True),
        sa.Column('name', sa.String(length=120), nullable=True),
        sa.Column('longitude', sa.Float(), nullable=False),
        sa.Column('latitude', sa.Float(), nullable=False),
        sa.Column('status', sa.SmallInteger(), nullable=False, server_default='1'),
        sa.Column('status_changed_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('geometry', geoalchemy2.types.Geometry(geometry_type='MULTIPOINT', srid=4326, spatial_index=False), nullable=False),
        sa.Column('created_date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('modified_date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('deleted_date', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['data_version_id'], ['data_versions.id'], ondelete='CASCADE'),
    )
    op.create_index('idx_codigos_fijos_data_version_id', 'codigos_fijos', ['data_version_id'], unique=False)
    op.create_index('idx_codigos_fijos_geometry', 'codigos_fijos', ['geometry'], postgresql_using='gist')
    op.create_index('idx_codigos_fijos_version_fixed_code', 'codigos_fijos', ['data_version_id', 'fixed_code'], unique=False)
    op.create_index('idx_codigos_fijos_version_sql_code', 'codigos_fijos', ['data_version_id', 'sql_code'], unique=False)
    op.create_index('idx_codigos_fijos_version_status', 'codigos_fijos', ['data_version_id', 'status'], unique=False)

    # 8. Crear tabla especializada lotes
    op.create_table(
        'lotes',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('data_version_id', sa.UUID(), nullable=False),
        sa.Column('source_feature_id', sa.String(length=120), nullable=True),
        sa.Column('source_id', sa.Integer(), nullable=True),
        sa.Column('lot_number', sa.String(length=15), nullable=True),
        sa.Column('geometry', geoalchemy2.types.Geometry(geometry_type='MULTIPOLYGON', srid=4326, spatial_index=False), nullable=False),
        sa.Column('created_date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('modified_date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('deleted_date', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['data_version_id'], ['data_versions.id'], ondelete='CASCADE'),
    )
    op.create_index('idx_lotes_data_version_id', 'lotes', ['data_version_id'], unique=False)
    op.create_index('idx_lotes_geometry', 'lotes', ['geometry'], postgresql_using='gist')
    op.create_index('idx_lotes_version_lot_number', 'lotes', ['data_version_id', 'lot_number'], unique=False)

    # 9. Crear tabla especializada manzanas
    op.create_table(
        'manzanas',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('data_version_id', sa.UUID(), nullable=False),
        sa.Column('source_feature_id', sa.String(length=120), nullable=True),
        sa.Column('source_id', sa.Integer(), nullable=True),
        sa.Column('uv_block_code', sa.String(length=20), nullable=True),
        sa.Column('uv', sa.String(length=15), nullable=True),
        sa.Column('block_number', sa.String(length=10), nullable=True),
        sa.Column('geometry', geoalchemy2.types.Geometry(geometry_type='MULTIPOLYGON', srid=4326, spatial_index=False), nullable=False),
        sa.Column('created_date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('modified_date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('deleted_date', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['data_version_id'], ['data_versions.id'], ondelete='CASCADE'),
    )
    op.create_index('idx_manzanas_data_version_id', 'manzanas', ['data_version_id'], unique=False)
    op.create_index('idx_manzanas_geometry', 'manzanas', ['geometry'], postgresql_using='gist')
    op.create_index('idx_manzanas_version_uv_block', 'manzanas', ['data_version_id', 'uv', 'block_number'], unique=False)
    op.create_index('idx_manzanas_version_uv_block_code', 'manzanas', ['data_version_id', 'uv_block_code'], unique=False)

    # 10. Crear tabla especializada vias
    op.create_table(
        'vias',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('data_version_id', sa.UUID(), nullable=False),
        sa.Column('source_feature_id', sa.String(length=120), nullable=True),
        sa.Column('osm_id', sa.BigInteger(), nullable=True),
        sa.Column('name', sa.String(length=48), nullable=True),
        sa.Column('reference', sa.String(length=16), nullable=True),
        sa.Column('road_type', sa.String(length=16), nullable=True),
        sa.Column('is_one_way', sa.Boolean(), nullable=True),
        sa.Column('is_bridge', sa.Boolean(), nullable=True),
        sa.Column('max_speed', sa.Integer(), nullable=True),
        sa.Column('object_id', sa.BigInteger(), nullable=True),
        sa.Column('legacy_name', sa.String(length=40), nullable=True),
        sa.Column('legacy_osm_id', sa.BigInteger(), nullable=True),
        sa.Column('highway_code', sa.BigInteger(), nullable=True),
        sa.Column('geometry', geoalchemy2.types.Geometry(geometry_type='MULTILINESTRING', srid=4326, spatial_index=False), nullable=False),
        sa.Column('created_date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('modified_date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('deleted_date', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['data_version_id'], ['data_versions.id'], ondelete='CASCADE'),
    )
    op.create_index('idx_vias_data_version_id', 'vias', ['data_version_id'], unique=False)
    op.create_index('idx_vias_geometry', 'vias', ['geometry'], postgresql_using='gist')
    op.create_index('idx_vias_version_osm_id', 'vias', ['data_version_id', 'osm_id'], unique=False)
    op.create_index('idx_vias_version_name', 'vias', ['data_version_id', 'name'], unique=False)

    # 11. Retirar geographic_features
    op.drop_index('idx_geographic_features_geometry', table_name='geographic_features', postgresql_using='gist')
    op.drop_index('ix_geographic_features_data_version_id', table_name='geographic_features')
    op.drop_table('geographic_features')


def downgrade() -> None:
    # 1. Recrear geographic_features (estructura vacía)
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

    # 2. Eliminar tablas tipadas
    op.drop_index('idx_vias_version_name', table_name='vias')
    op.drop_index('idx_vias_version_osm_id', table_name='vias')
    op.drop_index('idx_vias_geometry', table_name='vias', postgresql_using='gist')
    op.drop_index('idx_vias_data_version_id', table_name='vias')
    op.drop_table('vias')

    op.drop_index('idx_manzanas_version_uv_block_code', table_name='manzanas')
    op.drop_index('idx_manzanas_version_uv_block', table_name='manzanas')
    op.drop_index('idx_manzanas_geometry', table_name='manzanas', postgresql_using='gist')
    op.drop_index('idx_manzanas_data_version_id', table_name='manzanas')
    op.drop_table('manzanas')

    op.drop_index('idx_lotes_version_lot_number', table_name='lotes')
    op.drop_index('idx_lotes_geometry', table_name='lotes', postgresql_using='gist')
    op.drop_index('idx_lotes_data_version_id', table_name='lotes')
    op.drop_table('lotes')

    op.drop_index('idx_codigos_fijos_version_status', table_name='codigos_fijos')
    op.drop_index('idx_codigos_fijos_version_sql_code', table_name='codigos_fijos')
    op.drop_index('idx_codigos_fijos_version_fixed_code', table_name='codigos_fijos')
    op.drop_index('idx_codigos_fijos_geometry', table_name='codigos_fijos', postgresql_using='gist')
    op.drop_index('idx_codigos_fijos_data_version_id', table_name='codigos_fijos')
    op.drop_table('codigos_fijos')

    # 3. Eliminar restricciones y columna kind de layers
    op.drop_constraint('ck_layers_kind_name_geom', 'layers', type_='check')
    op.drop_constraint('uq_layers_kind', 'layers', type_='unique')
    op.drop_column('layers', 'kind')
