import uuid
from datetime import datetime, timezone
import pytest
from app.modules.layers.domain.entities.codigo_fijo import CodigoFijo
from app.modules.layers.domain.entities.data_version import DataVersion
from app.modules.layers.domain.entities.lote import Lote
from app.modules.layers.domain.entities.manzana import Manzana
from app.modules.layers.domain.entities.via import Via
from app.modules.layers.domain.enums import CodigoFijoStatus, DataVersionStatus
from app.modules.layers.domain.exceptions import InvalidDataVersionStatusException


def test_data_version_creation_and_transitions():
    version_id = uuid.uuid4()
    layer_id = uuid.uuid4()

    version = DataVersion(
        id=version_id,
        layer_id=layer_id,
        version_number=1,
        source_filename="test_dataset.zip",
    )

    assert version.id == version_id
    assert version.layer_id == layer_id
    assert version.version_number == 1
    assert version.status == DataVersionStatus.PROCESSING
    assert version.feature_count == 0
    assert version.error_message is None

    # Transición a READY
    version.mark_as_ready(feature_count=150)
    assert version.status == DataVersionStatus.READY
    assert version.feature_count == 150
    assert version.error_message is None

    # Intentar transicionar una versión READY lanza error
    with pytest.raises(InvalidDataVersionStatusException):
        version.mark_as_failed("Error")


def test_data_version_transition_to_failed():
    version = DataVersion(
        id=uuid.uuid4(),
        layer_id=uuid.uuid4(),
        version_number=2,
        source_filename="bad_dataset.zip",
    )

    version.mark_as_failed("Shapefile corrupto.")
    assert version.status == DataVersionStatus.FAILED
    assert version.error_message == "Shapefile corrupto."

    with pytest.raises(InvalidDataVersionStatusException):
        version.mark_as_ready(10)


def test_typed_entities_creation():
    version_id = uuid.uuid4()
    now = datetime.now(timezone.utc)

    cf = CodigoFijo(
        id=uuid.uuid4(),
        data_version_id=version_id,
        source_feature_id="CF_001",
        label="12345",
        sql_code=1001,
        sig_code="SIG-1",
        fixed_code=2001,
        name="Usuario 1",
        longitude=-63.18,
        latitude=-17.78,
        status=CodigoFijoStatus.NORMAL,
        status_changed_at=now,
        geometry_wkt="MULTIPOINT((-63.18 -17.78))",
    )
    assert cf.status == CodigoFijoStatus.NORMAL
    assert cf.fixed_code == 2001

    lote = Lote(
        id=uuid.uuid4(),
        data_version_id=version_id,
        source_feature_id="LOT_001",
        source_id=10,
        lot_number="12",
        geometry_wkt="MULTIPOLYGON(((-63.1 -17.7, -63.2 -17.7, -63.2 -17.8, -63.1 -17.7)))",
    )
    assert lote.lot_number == "12"

    mza = Manzana(
        id=uuid.uuid4(),
        data_version_id=version_id,
        source_feature_id="MZA_001",
        source_id=20,
        uv_block_code="UV1_MZA2",
        uv="UV1",
        block_number="MZA2",
        geometry_wkt="MULTIPOLYGON(((-63.1 -17.7, -63.2 -17.7, -63.2 -17.8, -63.1 -17.7)))",
    )
    assert mza.uv == "UV1"

    via = Via(
        id=uuid.uuid4(),
        data_version_id=version_id,
        source_feature_id="VIA_001",
        osm_id=999,
        name="Av. Principal",
        reference="R-1",
        road_type="primary",
        is_one_way=True,
        is_bridge=False,
        max_speed=60,
        object_id=1,
        legacy_name=None,
        legacy_osm_id=None,
        highway_code=None,
        geometry_wkt="MULTILINESTRING((-63.1 -17.7, -63.2 -17.8))",
    )
    assert via.name == "Av. Principal"
    assert via.is_one_way is True
