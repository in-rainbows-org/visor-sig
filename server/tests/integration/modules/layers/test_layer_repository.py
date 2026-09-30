import uuid
import pytest
from app.modules.layers.domain.entities.layer import Layer
from app.modules.layers.domain.enums import GeometryType, LayerColor, LayerKind
from app.modules.layers.infrastructure.persistence.models.layer_model import LayerModel
from app.modules.layers.infrastructure.persistence.mappers.layer_mapper import LayerMapper
from app.modules.layers.infrastructure.persistence.repositories.sqlmodel_layer_repository import (
    SqlModelLayerRepository,
)


def test_layer_mapper_bidirectional():
    layer_id = uuid.uuid4()
    domain_layer = Layer(
        id=layer_id,
        kind=LayerKind.VIAS,
        name="Vías",
        geometry_type=GeometryType.LINE,
        color=LayerColor.RED,
        active_data_version_id=None,
    )

    model = LayerMapper.to_model(domain_layer)
    assert model.id == layer_id
    assert model.kind == "VIAS"
    assert model.name == "Vías"
    assert model.geometry_type == "LINE"
    assert model.color == "RED"
    assert model.deleted_date is None

    restored = LayerMapper.to_domain(model)
    assert restored.id == domain_layer.id
    assert restored.kind == domain_layer.kind
    assert restored.name == domain_layer.name
    assert restored.geometry_type == domain_layer.geometry_type
    assert restored.color == domain_layer.color
    assert restored.active_data_version_id is None


def test_sqlmodel_layer_repository_save_and_find_by_kind(db_session):
    repo = SqlModelLayerRepository(db_session)

    # Buscar por kind
    found_by_kind = repo.find_by_kind(LayerKind.LOTES)
    assert found_by_kind is not None
    assert found_by_kind.name == "Lotes"
    assert found_by_kind.kind == LayerKind.LOTES

    # Buscar por id
    found_by_id = repo.find_by_id(found_by_kind.id)
    assert found_by_id is not None
    assert found_by_id.id == found_by_kind.id

    # Actualizar color y guardar
    found_by_kind.change_color(LayerColor.ORANGE)
    repo.save(found_by_kind)

    refreshed = repo.find_by_id(found_by_kind.id)
    assert refreshed is not None
    assert refreshed.color == LayerColor.ORANGE
