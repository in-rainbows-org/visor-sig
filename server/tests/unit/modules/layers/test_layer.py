import pytest
import uuid
from app.modules.layers.domain.enums import GeometryType, LayerColor, LayerKind
from app.modules.layers.domain.entities.layer import Layer
from app.modules.layers.domain.exceptions import InvalidLayerNameException


def test_create_layer_with_valid_attributes():
    layer_id = uuid.uuid4()
    layer = Layer(
        id=layer_id,
        kind=LayerKind.LOTES,
        name="Lotes",
        geometry_type=GeometryType.POLYGON,
        color=LayerColor.ORANGE,
    )
    assert layer.id == layer_id
    assert layer.kind == LayerKind.LOTES
    assert layer.name == "Lotes"
    assert layer.geometry_type == GeometryType.POLYGON
    assert layer.color == LayerColor.ORANGE
    assert layer.active_data_version_id is None


def test_layer_empty_name_raises_exception():
    with pytest.raises(InvalidLayerNameException):
        Layer(
            id=uuid.uuid4(),
            kind=LayerKind.CODIGOS_FIJOS,
            name="",
            geometry_type=GeometryType.POINT,
            color=LayerColor.BLUE,
        )

    with pytest.raises(InvalidLayerNameException):
        Layer(
            id=uuid.uuid4(),
            kind=LayerKind.CODIGOS_FIJOS,
            name="   ",
            geometry_type=GeometryType.POINT,
            color=LayerColor.BLUE,
        )


def test_layer_name_exceeding_max_length_raises_exception():
    with pytest.raises(InvalidLayerNameException):
        Layer(
            id=uuid.uuid4(),
            kind=LayerKind.VIAS,
            name="a" * 121,
            geometry_type=GeometryType.LINE,
            color=LayerColor.GREEN,
        )


def test_layer_enums_values():
    assert set(LayerKind) == {"CODIGOS_FIJOS", "LOTES", "MANZANAS", "VIAS"}
    assert set(GeometryType) == {"POINT", "LINE", "POLYGON"}
    assert set(LayerColor) == {"BLUE", "ORANGE", "GREEN", "VIOLET", "RED", "LIGHT_BLUE", "YELLOW"}
