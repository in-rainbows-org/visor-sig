import uuid
from datetime import datetime, timezone

from app.core.dependencies import AdminUser, CurrentUser, DBSession, UoWDep
from app.modules.layers.application.queries.list_data_version import (
    ListDataVersionsQuery,
    ListDataVersionsQueryHandler,
)
from app.modules.layers.application.queries.list_layers import (
    ListLayersQuery,
    ListLayersQueryHandler,
)
from app.modules.layers.application.use_cases.activate_data_version import (
    ActivateDataVersionCommand,
    ActivateDataVersionUseCase,
)
from app.modules.layers.application.use_cases.change_layer_color import (
    ChangeLayerColorCommand,
    ChangeLayerColorUseCase,
)
from app.modules.layers.application.use_cases.import_geographic_data import (
    ImportGeographicDataCommand,
    ImportGeographicDataUseCase,
)
from app.modules.layers.domain.enums import (
    DataVersionStatus,
    GeometryType,
    LayerColor,
    LayerKind,
)
from app.modules.layers.infrastructure.api.schemas.data_version_schemas import (
    DataVersionListRead,
    DataVersionRead,
)
from app.modules.layers.infrastructure.api.schemas.layer_schemas import (
    ChangeLayerColorRequest,
    LayerListRead,
    LayerRead,
)
from app.modules.layers.infrastructure.persistence.repositories.sqlmodel_data_version_repository import (
    SqlModelDataVersionRepository,
)
from app.modules.layers.infrastructure.persistence.repositories.sqlmodel_layer_repository import (
    SqlModelLayerRepository,
)
from app.modules.layers.infrastructure.processing.pyogrio_shapefile_processor import (
    PyogrioShapefileProcessor,
)
from app.modules.layers.infrastructure.services.cadastral_spatial_linker import (
    CadastralSpatialLinker,
)
from fastapi import APIRouter, File, UploadFile, status

router = APIRouter(prefix="/layers", tags=["Layers"])


# ==============================================================================
# CAPAS (CATÁLOGO Y PROPIEDADES)
# ==============================================================================
@router.get(
    "",
    response_model=LayerListRead,
    status_code=status.HTTP_200_OK,
    summary="Listar capas fijas del catálogo",
)
def list_layers(
    db: DBSession,
    current_user: CurrentUser,
) -> LayerListRead:
    repo = SqlModelLayerRepository(db)
    handler = ListLayersQueryHandler(repo)
    result = handler.execute(ListLayersQuery())
    items = [
        LayerRead(
            id=d.id,
            kind=LayerKind(d.kind),
            name=d.name,
            geometry_type=GeometryType(d.geometry_type),
            color=LayerColor(d.color),
            active_data_version_id=d.active_data_version_id,
            updated_at=d.updated_at,
        )
        for d in result.items
    ]
    return LayerListRead(items=items)


@router.patch(
    "/{layer_id}/color",
    response_model=LayerRead,
    status_code=status.HTTP_200_OK,
    summary="Cambiar exclusivamente el color de una capa",
)
def change_layer_color(
    layer_id: uuid.UUID,
    payload: ChangeLayerColorRequest,
    db: DBSession,
    uow: UoWDep,
    current_user: AdminUser,
) -> LayerRead:
    repo = SqlModelLayerRepository(db)
    use_case = ChangeLayerColorUseCase(repo, uow)
    command = ChangeLayerColorCommand(
        layer_id=layer_id,
        color=payload.color,
        user_id=current_user.user_id,
    )
    layer = use_case.execute(command)

    return LayerRead(
        id=layer.id,
        kind=layer.kind,
        name=layer.name,
        geometry_type=layer.geometry_type,
        color=layer.color,
        active_data_version_id=layer.active_data_version_id,
        updated_at=layer.updated_at,
    )


# ==============================================================================
# VERSIONES DE DATOS GEOGRÁFICOS
# ==============================================================================
@router.get(
    "/{layer_id}/data-versions",
    response_model=DataVersionListRead,
    status_code=status.HTTP_200_OK,
    summary="Listar versiones históricas de una capa",
)
def list_data_versions(
    layer_id: uuid.UUID,
    db: DBSession,
    current_user: AdminUser,
) -> DataVersionListRead:
    dv_repo = SqlModelDataVersionRepository(db)
    layer_repo = SqlModelLayerRepository(db)
    handler = ListDataVersionsQueryHandler(dv_repo, layer_repo)
    result = handler.execute(ListDataVersionsQuery(layer_id=layer_id))
    items = [
        DataVersionRead(
            id=d.id,
            layer_id=d.layer_id,
            version_number=d.version_number,
            status=DataVersionStatus(d.status),
            source_filename=d.source_filename,
            feature_count=d.feature_count,
            error_message=d.error_message,
            is_active=d.is_active,
            created_at=d.created_at,
        )
        for d in result.items
    ]
    return DataVersionListRead(items=items)


@router.post(
    "/{layer_id}/data-versions",
    response_model=DataVersionRead,
    status_code=status.HTTP_201_CREATED,
    summary="Importar un archivo ZIP Shapefile a una capa",
)
async def import_data_version(
    layer_id: uuid.UUID,
    db: DBSession,
    uow: UoWDep,
    current_user: AdminUser,
    file: UploadFile = File(...),
) -> DataVersionRead:
    contents = await file.read()
    filename = file.filename or "unknown.zip"

    layer_repo = SqlModelLayerRepository(db)
    version_repo = SqlModelDataVersionRepository(db)
    processor = PyogrioShapefileProcessor()
    cadastral_linker = CadastralSpatialLinker(db)

    use_case = ImportGeographicDataUseCase(
        layer_repository=layer_repo,
        version_repository=version_repo,
        processor=processor,
        uow=uow,
        cadastral_linker=cadastral_linker,
    )

    command = ImportGeographicDataCommand(
        layer_id=layer_id,
        file_bytes=contents,
        filename=filename,
        user_id=current_user.user_id,
    )
    version = use_case.execute(command)

    return DataVersionRead(
        id=version.id,
        layer_id=version.layer_id,
        version_number=version.version_number,
        status=version.status,
        source_filename=version.source_filename,
        feature_count=version.feature_count,
        error_message=version.error_message,
        is_active=version.is_active,
        created_at=version.created_at or datetime.now(timezone.utc),
    )


@router.post(
    "/{layer_id}/data-versions/{version_id}/activate",
    response_model=DataVersionRead,
    status_code=status.HTTP_200_OK,
    summary="Activar una versión histórica (reversión / rollback)",
)
def activate_data_version(
    layer_id: uuid.UUID,
    version_id: uuid.UUID,
    db: DBSession,
    uow: UoWDep,
    current_user: AdminUser,
) -> DataVersionRead:
    layer_repo = SqlModelLayerRepository(db)
    version_repo = SqlModelDataVersionRepository(db)
    use_case = ActivateDataVersionUseCase(layer_repo, version_repo, uow)
    command = ActivateDataVersionCommand(
        layer_id=layer_id,
        version_id=version_id,
        user_id=current_user.user_id,
    )
    version = use_case.execute(command)

    return DataVersionRead(
        id=version.id,
        layer_id=version.layer_id,
        version_number=version.version_number,
        status=version.status,
        source_filename=version.source_filename,
        feature_count=version.feature_count,
        error_message=version.error_message,
        is_active=version.is_active,
        created_at=version.created_at or datetime.now(timezone.utc),
    )
