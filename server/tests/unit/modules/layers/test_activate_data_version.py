import uuid
from unittest.mock import MagicMock
import pytest

from app.modules.layers.application.use_cases.activate_data_version import (
    ActivateDataVersionCommand,
    ActivateDataVersionUseCase,
)
from app.modules.layers.domain.entities.data_version import DataVersion
from app.modules.layers.domain.enums import DataVersionStatus
from app.modules.layers.domain.exceptions import DataVersionNotFoundException
from app.modules.layers.domain.repositories.data_version_repository import (
    DataVersionRepository,
)
from app.modules.layers.domain.entities.layer import Layer
from app.modules.layers.domain.enums import GeometryType, LayerColor, LayerKind
from app.modules.layers.domain.exceptions import (
    InvalidDataVersionAssignmentException,
    LayerNotFoundException,
)
from app.modules.layers.domain.repositories.layer_repository import LayerRepository
from app.shared.infrastructure.unit_of_work import SqlModelUnitOfWork


class TestActivateDataVersionUseCase:
    @pytest.fixture
    def mock_layer_repo(self) -> MagicMock:
        return MagicMock(spec=LayerRepository)

    @pytest.fixture
    def mock_version_repo(self) -> MagicMock:
        return MagicMock(spec=DataVersionRepository)

    @pytest.fixture
    def mock_uow(self) -> MagicMock:
        return MagicMock(spec=SqlModelUnitOfWork)

    @pytest.fixture
    def use_case(self, mock_layer_repo, mock_version_repo, mock_uow) -> ActivateDataVersionUseCase:
        return ActivateDataVersionUseCase(
            layer_repository=mock_layer_repo,
            version_repository=mock_version_repo,
            uow=mock_uow,
        )

    def test_activate_ready_version_success(
        self, use_case, mock_layer_repo, mock_version_repo, mock_uow
    ):
        layer_id = uuid.uuid4()
        version_id = uuid.uuid4()
        layer = Layer(
            id=layer_id,
            kind=LayerKind.LOTES,
            name="Lotes",
            geometry_type=GeometryType.POLYGON,
            color=LayerColor.BLUE,
            active_data_version_id=uuid.uuid4(),  # Ya tenía una versión
        )
        version = DataVersion(
            id=version_id,
            layer_id=layer_id,
            version_number=1,
            source_filename="v1.zip",
            status=DataVersionStatus.READY,
            feature_count=100,
        )
        mock_layer_repo.find_by_id.return_value = layer
        mock_version_repo.find_by_id.return_value = version

        result = use_case.execute(ActivateDataVersionCommand(layer_id=layer_id, version_id=version_id))

        assert result.id == version_id
        assert result.is_active is True
        mock_version_repo.set_active_version.assert_called_once_with(layer_id, version_id)
        mock_uow.commit.assert_called_once()

    def test_activate_failed_version_raises_conflict(
        self, use_case, mock_layer_repo, mock_version_repo
    ):
        layer_id = uuid.uuid4()
        version_id = uuid.uuid4()
        layer = Layer(
            id=layer_id,
            kind=LayerKind.LOTES,
            name="Lotes",
            geometry_type=GeometryType.POLYGON,
            color=LayerColor.BLUE,
        )
        version = DataVersion(
            id=version_id,
            layer_id=layer_id,
            version_number=2,
            source_filename="v2.zip",
            status=DataVersionStatus.FAILED,
            error_message="CRS mismatch",
        )
        mock_layer_repo.find_by_id.return_value = layer
        mock_version_repo.find_by_id.return_value = version

        with pytest.raises(InvalidDataVersionAssignmentException) as exc_info:
            use_case.execute(ActivateDataVersionCommand(layer_id=layer_id, version_id=version_id))
        assert "READY" in str(exc_info.value)

    def test_activate_wrong_layer_version_raises_conflict(
        self, use_case, mock_layer_repo, mock_version_repo
    ):
        layer_id = uuid.uuid4()
        other_layer_id = uuid.uuid4()
        version_id = uuid.uuid4()

        layer = Layer(
            id=layer_id,
            kind=LayerKind.LOTES,
            name="Lotes",
            geometry_type=GeometryType.POLYGON,
            color=LayerColor.BLUE,
        )
        version = DataVersion(
            id=version_id,
            layer_id=other_layer_id,  # Pertenece a otra capa
            version_number=1,
            source_filename="other.zip",
            status=DataVersionStatus.READY,
        )
        mock_layer_repo.find_by_id.return_value = layer
        mock_version_repo.find_by_id.return_value = version

        with pytest.raises(InvalidDataVersionAssignmentException) as exc_info:
            use_case.execute(ActivateDataVersionCommand(layer_id=layer_id, version_id=version_id))
        assert "misma capa" in str(exc_info.value)

    def test_activate_nonexistent_layer_raises_not_found(self, use_case, mock_layer_repo):
        mock_layer_repo.find_by_id.return_value = None
        with pytest.raises(LayerNotFoundException):
            use_case.execute(
                ActivateDataVersionCommand(layer_id=uuid.uuid4(), version_id=uuid.uuid4())
            )

    def test_activate_nonexistent_version_raises_not_found(
        self, use_case, mock_layer_repo, mock_version_repo
    ):
        layer = Layer(
            id=uuid.uuid4(),
            kind=LayerKind.CODIGOS_FIJOS,
            name="Códigos Fijos",
            geometry_type=GeometryType.POINT,
            color=LayerColor.YELLOW,
        )
        mock_layer_repo.find_by_id.return_value = layer
        mock_version_repo.find_by_id.return_value = None

        with pytest.raises(DataVersionNotFoundException):
            use_case.execute(
                ActivateDataVersionCommand(layer_id=layer.id, version_id=uuid.uuid4())
            )
