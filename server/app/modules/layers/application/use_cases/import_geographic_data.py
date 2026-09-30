import logging
import uuid
from dataclasses import dataclass
from typing import Optional

from app.core.error_handlers import PayloadTooLargeError, UnsupportedMediaTypeError
from app.modules.layers.application.mappers.codigo_fijo_dataset_mapper import (
    CodigoFijoDatasetMapper,
)
from app.modules.layers.application.mappers.lote_dataset_mapper import (
    LoteDatasetMapper,
)
from app.modules.layers.application.mappers.manzana_dataset_mapper import (
    ManzanaDatasetMapper,
)
from app.modules.layers.application.mappers.via_dataset_mapper import (
    ViaDatasetMapper,
)
from app.modules.layers.application.ports.providers.shapefile_processor import (
    ShapefileProcessor,
)
from app.modules.layers.domain.entities.data_version import DataVersion
from app.modules.layers.domain.enums import DataVersionStatus, LayerKind
from app.modules.layers.domain.exceptions import LayerNotFoundException
from app.modules.layers.domain.repositories.data_version_repository import (
    DataVersionRepository,
)
from app.modules.layers.domain.repositories.layer_repository import LayerRepository
from app.modules.layers.infrastructure.persistence.repositories.sqlmodel_codigo_fijo_repository import (
    SqlModelCodigoFijoRepository,
)
from app.modules.layers.infrastructure.persistence.repositories.sqlmodel_lote_repository import (
    SqlModelLoteRepository,
)
from app.modules.layers.infrastructure.persistence.repositories.sqlmodel_manzana_repository import (
    SqlModelManzanaRepository,
)
from app.modules.layers.infrastructure.persistence.repositories.sqlmodel_via_repository import (
    SqlModelViaRepository,
)
from app.shared.infrastructure.unit_of_work import SqlModelUnitOfWork

logger = logging.getLogger(__name__)

MAX_ZIP_SIZE = 100 * 1024 * 1024  # 100 MB


@dataclass(frozen=True)
class ImportGeographicDataCommand:
    layer_id: uuid.UUID
    file_bytes: bytes
    filename: str
    user_id: Optional[str] = None


class ImportGeographicDataUseCase:
    """
    Caso de uso para importar un paquete ZIP Shapefile a una de las 4 capas tipadas del sistema.
    Garantiza:
    - Validación inmediata de formato y límites.
    - Registro comprometido en estado PROCESSING para trazabilidad.
    - Procesamiento y validación de columnas por LayerKind.
    - Inserción especializada en la tabla correcta (codigos_fijos, lotes, manzanas, vias).
    - Publicación atómica a READY actualizando active_data_version_id en la capa.
    - Manejo seguro de fallos marcando FAILED sin corromper la versión activa previa.
    """

    def __init__(
        self,
        layer_repository: LayerRepository,
        version_repository: DataVersionRepository,
        processor: ShapefileProcessor,
        uow: SqlModelUnitOfWork,
    ) -> None:
        self.layer_repository = layer_repository
        self.version_repository = version_repository
        self.processor = processor
        self.uow = uow

    def execute(self, command: ImportGeographicDataCommand) -> DataVersion:
        # 1. Validaciones previas de formato y tamaño
        if not command.filename.lower().endswith(".zip") or not command.file_bytes.startswith(b"PK"):
            raise UnsupportedMediaTypeError("Tipo de medio no soportado. Solo se permiten archivos ZIP.")

        if len(command.file_bytes) > MAX_ZIP_SIZE:
            raise PayloadTooLargeError("El archivo excede el tamaño máximo permitido de 100 MB.")

        # 2. Validar existencia de la capa fija
        layer = self.layer_repository.find_by_id(command.layer_id)
        if layer is None:
            raise LayerNotFoundException(command.layer_id)

        # 3. Reservar versión y persistir en PROCESSING
        next_version_num = self.version_repository.get_next_version_number(layer.id)
        data_version = DataVersion(
            id=uuid.uuid4(),
            layer_id=layer.id,
            version_number=next_version_num,
            source_filename=command.filename,
            status=DataVersionStatus.PROCESSING,
            feature_count=0,
            error_message=None,
            imported_by_user_id=command.user_id,
        )
        self.version_repository.save(data_version, imported_by_user_id=command.user_id)
        self.uow.commit()

        # 4. Procesamiento, inserción tipada y activación atómica
        try:
            process_result = self.processor.process_zip(
                zip_bytes=command.file_bytes,
                target_geometry_type=layer.geometry_type.value,
            )

            # Validar e insertar según LayerKind
            if process_result.features:
                sample_props = process_result.features[0].properties
            else:
                sample_props = {}

            session = self.uow.session

            if layer.kind == LayerKind.CODIGOS_FIJOS:
                if process_result.features:
                    CodigoFijoDatasetMapper.validate_properties(sample_props)
                models = [
                    CodigoFijoDatasetMapper.to_model(f, data_version.id)
                    for f in process_result.features
                ]
                repo = SqlModelCodigoFijoRepository(session)
                repo.bulk_insert(models)

            elif layer.kind == LayerKind.LOTES:
                if process_result.features:
                    LoteDatasetMapper.validate_properties(sample_props)
                models = [
                    LoteDatasetMapper.to_model(f, data_version.id)
                    for f in process_result.features
                ]
                repo = SqlModelLoteRepository(session)
                repo.bulk_insert(models)

            elif layer.kind == LayerKind.MANZANAS:
                if process_result.features:
                    ManzanaDatasetMapper.validate_properties(sample_props)
                models = [
                    ManzanaDatasetMapper.to_model(f, data_version.id)
                    for f in process_result.features
                ]
                repo = SqlModelManzanaRepository(session)
                repo.bulk_insert(models)

            elif layer.kind == LayerKind.VIAS:
                if process_result.features:
                    ViaDatasetMapper.validate_properties(sample_props)
                models = [
                    ViaDatasetMapper.to_model(f, data_version.id)
                    for f in process_result.features
                ]
                repo = SqlModelViaRepository(session)
                repo.bulk_insert(models)

            else:
                raise RuntimeError(f"LayerKind desconocido: {layer.kind}")

            feature_count = len(process_result.features)
            data_version.mark_as_ready(feature_count=feature_count)
            self.version_repository.save(data_version, imported_by_user_id=command.user_id)

            layer.set_active_data_version(data_version.id)
            self.layer_repository.save(layer)

            self.uow.commit()
            return data_version

        except Exception as exc:
            self.uow.rollback()

            session = self.uow.session
            try:
                if layer.kind == LayerKind.CODIGOS_FIJOS:
                    SqlModelCodigoFijoRepository(session).delete_by_version(data_version.id)
                elif layer.kind == LayerKind.LOTES:
                    SqlModelLoteRepository(session).delete_by_version(data_version.id)
                elif layer.kind == LayerKind.MANZANAS:
                    SqlModelManzanaRepository(session).delete_by_version(data_version.id)
                elif layer.kind == LayerKind.VIAS:
                    SqlModelViaRepository(session).delete_by_version(data_version.id)
            except Exception:
                pass

            error_msg = exc.message if hasattr(exc, "message") else str(exc)
            logger.warning(
                "Fallo de importación geográfica en capa %s (versión %s): %s",
                layer.id,
                data_version.version_number,
                error_msg,
                extra={
                    "layer_id": str(layer.id),
                    "version_id": str(data_version.id),
                    "version_number": data_version.version_number,
                    "error": error_msg,
                },
            )

            data_version.mark_as_failed(error_message=error_msg)
            self.version_repository.save(data_version, imported_by_user_id=command.user_id)
            self.uow.commit()

            raise exc
