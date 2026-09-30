import uuid
import pytest
from app.modules.layers.domain.entities.layer import KIND_CANONICAL_PROPERTIES, Layer
from app.modules.layers.domain.enums import GeometryType, LayerColor, LayerKind


def test_layer_change_color():
    layer = Layer(
        id=uuid.uuid4(),
        kind=LayerKind.LOTES,
        name="Lotes",
        geometry_type=GeometryType.POLYGON,
        color=LayerColor.ORANGE,
    )

    layer.change_color(LayerColor.GREEN)
    assert layer.color == LayerColor.GREEN


def test_layer_set_active_data_version():
    layer = Layer(
        id=uuid.uuid4(),
        kind=LayerKind.CODIGOS_FIJOS,
        name="Códigos Fijos",
        geometry_type=GeometryType.POINT,
        color=LayerColor.BLUE,
    )

    version_id = uuid.uuid4()
    layer.set_active_data_version(version_id)
    assert layer.active_data_version_id == version_id

    layer.set_active_data_version(None)
    assert layer.active_data_version_id is None


def test_canonical_properties_mapping():
    assert KIND_CANONICAL_PROPERTIES[LayerKind.CODIGOS_FIJOS] == ("Códigos Fijos", GeometryType.POINT)
    assert KIND_CANONICAL_PROPERTIES[LayerKind.LOTES] == ("Lotes", GeometryType.POLYGON)
    assert KIND_CANONICAL_PROPERTIES[LayerKind.MANZANAS] == ("Manzanas", GeometryType.POLYGON)
    assert KIND_CANONICAL_PROPERTIES[LayerKind.VIAS] == ("Vías", GeometryType.LINE)
