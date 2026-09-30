import uuid
from fastapi import APIRouter, File, UploadFile, status

from app.core.dependencies import AdminUser, CurrentUser, DBSession, UoWDep
from app.modules.layers.application.queries.get_data_version import GetDataVersionQuery
from app.modules.layers.application.queries.get_layer import GetLayerQuery
from app.modules.layers.application.queries.list_data_version import ListDataVersionsQuery
from app.modules.layers.application.queries.list_layers import ListLayersQuery
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
from app.modules.layers.domain.enums import DataVersionStatus
from app.modules.layers.infrastructure.api.schemas.data_version_schemas import (
    DataVersionListResponse,
    DataVersionResponse,
)
from app.modules.layers.infrastructure.api.schemas.layer_schemas import (
    ChangeLayerColorRequest,
    LayerListResponse,
    LayerResponse,
)
from app.modules.layers.infrastructure.persistence.mappers.data_version_mapper import (
    DataVersionMapper,
)
from app.modules.layers.infrastructure.persistence.models.data_version_model import (
    DataVersionModel,
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

router = APIRouter(prefix="/layers", tags=["Layers"])


# ==============================================================================
# CAPAS (CATÁLOGO Y PROPIEDADES)
# ==============================================================================
@router.get(
    "",
    response_model=LayerListResponse,
    status_code=status.HTTP_200_OK,
    summary="Listar capas fijas del catálogo",
)
def list_layers(
    db: DBSession,
    current_user: CurrentUser,
) -> LayerListResponse:
    query = ListLayersQuery(db)
    dtos = query.execute()
    items = [
        LayerResponse(
            id=d.id,
            kind=d.kind,  # type: ignore[arg-type]
            name=d.name,
            geometry_type=d.geometry_type,  # type: ignore[arg-type]
            color=d.color,  # type: ignore[arg-type]
            active_data_version_id=d.active_data_version_id,
            updated_at=d.updated_at,
        )
        for d in dtos
    ]
    return LayerListResponse(items=items)


@router.get(
    "/{layer_id}",
    response_model=LayerResponse,
    status_code=status.HTTP_200_OK,
    summary="Obtener una capa por ID",
)
def get_layer(
    layer_id: uuid.UUID,
    db: DBSession,
    current_user: CurrentUser,
) -> LayerResponse:
    query = GetLayerQuery(db)
    dto = query.execute(layer_id)
    return LayerResponse(
        id=dto.id,
        kind=dto.kind,  # type: ignore[arg-type]
        name=dto.name,
        geometry_type=dto.geometry_type,  # type: ignore[arg-type]
        color=dto.color,  # type: ignore[arg-type]
        active_data_version_id=dto.active_data_version_id,
        updated_at=dto.updated_at,
    )


@router.patch(
    "/{layer_id}/color",
    response_model=LayerResponse,
    status_code=status.HTTP_200_OK,
    summary="Cambiar exclusivamente el color de una capa",
)
def change_layer_color(
    layer_id: uuid.UUID,
    payload: ChangeLayerColorRequest,
    db: DBSession,
    uow: UoWDep,
    current_user: AdminUser,
) -> LayerResponse:
    repo = SqlModelLayerRepository(db)
    use_case = ChangeLayerColorUseCase(repo, uow)
    command = ChangeLayerColorCommand(
        layer_id=layer_id,
        color=payload.color,
    )
    use_case.execute(command)

    query = GetLayerQuery(db)
    dto = query.execute(layer_id)
    return LayerResponse(
        id=dto.id,
        kind=dto.kind,  # type: ignore[arg-type]
        name=dto.name,
        geometry_type=dto.geometry_type,  # type: ignore[arg-type]
        color=dto.color,  # type: ignore[arg-type]
        active_data_version_id=dto.active_data_version_id,
        updated_at=dto.updated_at,
    )


# ==============================================================================
# VERSIONES DE DATOS GEOGRÁFICOS
# ==============================================================================
@router.get(
    "/{layer_id}/data-versions",
    response_model=DataVersionListResponse,
    status_code=status.HTTP_200_OK,
    summary="Listar versiones históricas de una capa",
)
def list_data_versions(
    layer_id: uuid.UUID,
    db: DBSession,
    current_user: AdminUser,
) -> DataVersionListResponse:
    query = ListDataVersionsQuery(db)
    dtos = query.execute(layer_id)
    items = [
        DataVersionResponse(
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
        for d in dtos
    ]
    return DataVersionListResponse(items=items)


@router.post(
    "/{layer_id}/data-versions",
    response_model=DataVersionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Importar un archivo ZIP Shapefile a una capa",
)
async def import_data_version(
    layer_id: uuid.UUID,
    file: UploadFile = File(...),
    db: DBSession = None,  # type: ignore
    uow: UoWDep = None,  # type: ignore
    current_user: AdminUser = None,  # type: ignore
) -> DataVersionResponse:
    contents = await file.read()
    filename = file.filename or "unknown.zip"

    layer_repo = SqlModelLayerRepository(db)
    version_repo = SqlModelDataVersionRepository(db)
    processor = PyogrioShapefileProcessor()

    use_case = ImportGeographicDataUseCase(
        layer_repository=layer_repo,
        version_repository=version_repo,
        processor=processor,
        uow=uow,
    )

    command = ImportGeographicDataCommand(
        layer_id=layer_id,
        file_bytes=contents,
        filename=filename,
        user_id=current_user.user_id,
    )
    version = use_case.execute(command)

    model = db.get(DataVersionModel, version.id)
    dto = DataVersionMapper.to_dto(model, is_active=True)

    return DataVersionResponse(
        id=dto.id,
        layer_id=dto.layer_id,
        version_number=dto.version_number,
        status=DataVersionStatus(dto.status),
        source_filename=dto.source_filename,
        feature_count=dto.feature_count,
        error_message=dto.error_message,
        is_active=dto.is_active,
        created_at=dto.created_at,
    )


@router.get(
    "/{layer_id}/data-versions/{version_id}",
    response_model=DataVersionResponse,
    status_code=status.HTTP_200_OK,
    summary="Obtener metadatos de una versión específica",
)
def get_data_version(
    layer_id: uuid.UUID,
    version_id: uuid.UUID,
    db: DBSession,
    current_user: AdminUser,
) -> DataVersionResponse:
    query = GetDataVersionQuery(db)
    dto = query.execute(layer_id, version_id)
    return DataVersionResponse(
        id=dto.id,
        layer_id=dto.layer_id,
        version_number=dto.version_number,
        status=DataVersionStatus(dto.status),
        source_filename=dto.source_filename,
        feature_count=dto.feature_count,
        error_message=dto.error_message,
        is_active=dto.is_active,
        created_at=dto.created_at,
    )


@router.post(
    "/{layer_id}/data-versions/{version_id}/activate",
    response_model=DataVersionResponse,
    status_code=status.HTTP_200_OK,
    summary="Activar una versión histórica (reversión / rollback)",
)
def activate_data_version(
    layer_id: uuid.UUID,
    version_id: uuid.UUID,
    db: DBSession,
    uow: UoWDep,
    current_user: AdminUser,
) -> DataVersionResponse:
    layer_repo = SqlModelLayerRepository(db)
    version_repo = SqlModelDataVersionRepository(db)
    use_case = ActivateDataVersionUseCase(layer_repo, version_repo, uow)
    command = ActivateDataVersionCommand(layer_id=layer_id, version_id=version_id)
    version = use_case.execute(command)

    model = db.get(DataVersionModel, version.id)
    dto = DataVersionMapper.to_dto(model, is_active=True)
    return DataVersionResponse(
        id=dto.id,
        layer_id=dto.layer_id,
        version_number=dto.version_number,
        status=DataVersionStatus(dto.status),
        source_filename=dto.source_filename,
        feature_count=dto.feature_count,
        error_message=dto.error_message,
        is_active=dto.is_active,
        created_at=dto.created_at,
    )
