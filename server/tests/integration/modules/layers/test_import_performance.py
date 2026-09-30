import time

from app.core.dependencies import get_event_bus
from app.modules.layers.application.use_cases.import_geographic_data import (
    ImportGeographicDataCommand,
    ImportGeographicDataUseCase,
)
from app.modules.layers.domain.enums import DataVersionStatus, LayerKind
from app.modules.layers.infrastructure.persistence.repositories.sqlmodel_data_version_repository import (
    SqlModelDataVersionRepository,
)
from app.modules.layers.infrastructure.processing.pyogrio_shapefile_processor import (
    PyogrioShapefileProcessor,
)
from app.modules.layers.infrastructure.persistence.repositories.sqlmodel_layer_repository import (
    SqlModelLayerRepository,
)
from app.shared.infrastructure.unit_of_work import SqlModelUnitOfWork
from tests.fixtures_shapefiles import build_lotes_zip


def test_import_performance_and_batch_commit_count(db_session):
    """
    Verifica que la importación de un dataset no realice commits individuales por cada feature,
    sino únicamente dos commits en todo el ciclo de vida (uno para PROCESSING y otro para READY/features),
    y que se ejecute en menos de 5 segundos.
    """
    layer_repo = SqlModelLayerRepository(db_session)
    version_repo = SqlModelDataVersionRepository(db_session)
    processor = PyogrioShapefileProcessor()

    uow = SqlModelUnitOfWork(db_session, get_event_bus())

    layer = layer_repo.find_by_kind(LayerKind.LOTES)
    assert layer is not None

    # Espiar commits en Unit of Work
    original_commit = uow.commit
    commit_counter = {"count": 0}

    def counted_commit():
        commit_counter["count"] += 1
        return original_commit()

    uow.commit = counted_commit  # type: ignore

    use_case = ImportGeographicDataUseCase(
        layer_repository=layer_repo,
        version_repository=version_repo,
        processor=processor,
        uow=uow,
    )

    zip_bytes = build_lotes_zip(count=50)

    start_time = time.perf_counter()
    v = use_case.execute(
        ImportGeographicDataCommand(
            layer_id=layer.id,
            file_bytes=zip_bytes,
            filename="lotes.zip",
            user_id="perf-admin",
        )
    )
    duration = time.perf_counter() - start_time

    assert v.status == DataVersionStatus.READY
    assert v.feature_count == 50

    # Debe haber exactamente 2 commits: uno para registrar PROCESSING y uno final para las features + READY
    assert (
        commit_counter["count"] == 2
    ), f"Se esperaban 2 commits atómicos por lote, pero se registraron {commit_counter['count']}."

    # Tiempo de procesamiento en lote menor a 5 segundos
    assert (
        duration < 5.0
    ), f"La importación tardó {duration:.2f}s, superando el umbral de rendimiento de 5.0s."
