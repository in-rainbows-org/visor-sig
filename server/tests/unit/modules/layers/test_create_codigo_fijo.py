import uuid
import pytest
from unittest.mock import MagicMock

from app.modules.layers.application.use_cases.create_codigo_fijo import (
    CreateCodigoFijoCommand,
    CreateCodigoFijoUseCase,
)
from app.modules.layers.domain.entities.codigo_fijo import CodigoFijo
from app.modules.layers.domain.entities.layer import Layer
from app.modules.layers.domain.enums import (
    CodigoFijoStatus,
    GeometryType,
    LayerColor,
    LayerKind,
)
from app.modules.layers.domain.exceptions import CodigoFijoAlreadyExistsException


def test_create_codigo_fijo_success():
    repo = MagicMock()
    repo.find_by_fixed_code.return_value = None

    active_version_id = uuid.uuid4()
    mock_layer = Layer(
        id=uuid.uuid4(),
        kind=LayerKind.CODIGOS_FIJOS,
        name="Códigos Fijos",
        geometry_type=GeometryType.POINT,
        color=LayerColor.BLUE,
        active_data_version_id=active_version_id,
    )
    layer_repo = MagicMock()
    layer_repo.find_by_kind.return_value = mock_layer

    uow = MagicMock()

    use_case = CreateCodigoFijoUseCase(
        codigo_fijo_repository=repo,
        layer_repository=layer_repo,
        uow=uow,
    )

    command = CreateCodigoFijoCommand(
        fixed_code=102030,
        name="TEST USER",
        latitude=-17.7833,
        longitude=-63.1821,
        status=1,
    )

    result = use_case.execute(command)

    assert result.fixed_code == 102030
    assert result.name == "TEST USER"
    assert result.latitude == -17.7833
    assert result.longitude == -63.1821
    assert result.status == CodigoFijoStatus.NORMAL
    assert result.data_version_id == active_version_id
    assert result.geometry_wkt == "MULTIPOINT((-63.1821 -17.7833))"

    repo.save.assert_called_once_with(result)
    uow.commit.assert_called_once()


def test_create_codigo_fijo_duplicate_conflict():
    repo = MagicMock()
    existing_cf = MagicMock(spec=CodigoFijo)
    repo.find_by_fixed_code.return_value = existing_cf

    layer_repo = MagicMock()
    uow = MagicMock()

    use_case = CreateCodigoFijoUseCase(
        codigo_fijo_repository=repo,
        layer_repository=layer_repo,
        uow=uow,
    )

    command = CreateCodigoFijoCommand(
        fixed_code=102030,
        name="TEST USER",
        latitude=-17.7833,
        longitude=-63.1821,
        status=1,
    )

    with pytest.raises(CodigoFijoAlreadyExistsException):
        use_case.execute(command)

    repo.save.assert_not_called()
    uow.commit.assert_not_called()
