from typing import List, Optional
from fastapi import APIRouter, Query, status

from app.core.dependencies import CurrentUser, DBSession
from app.modules.consultations.application.queries.get_consultation_metadata import (
    GetConsultationMetadataQuery,
)
from app.modules.consultations.application.queries.search_entities import SearchEntitiesQuery
from app.modules.consultations.infrastructure.api.schemas.consultation_schemas import (
    ConsultationRecordSchema,
    FieldMetadataSchema,
    LayerMetadataSchema,
    PaginatedConsultationResponseSchema,
)
from app.modules.consultations.infrastructure.persistence.readers.sqlmodel_consultation_reader import (
    SqlModelConsultationReader,
)

router = APIRouter(prefix="/consultations", tags=["Consultations"])


@router.get(
    "/layers",
    response_model=List[LayerMetadataSchema],
    status_code=status.HTTP_200_OK,
    summary="Obtener capas disponibles y sus campos para consulta",
)
def get_consultation_layers(
    db: DBSession,
    current_user: CurrentUser,
) -> List[LayerMetadataSchema]:
    reader = SqlModelConsultationReader(db)
    query = GetConsultationMetadataQuery(reader)
    layers_dto = query.execute()

    return [
        LayerMetadataSchema(
            id=l.id,
            kind=l.kind,
            name=l.name,
            geometry_type=l.geometry_type,
            color=l.color,
            has_active_version=l.has_active_version,
            fields=[
                FieldMetadataSchema(key=f.key, label=f.label, type=f.type)
                for f in l.fields
            ],
        )
        for l in layers_dto
    ]


@router.get(
    "/search",
    response_model=PaginatedConsultationResponseSchema,
    status_code=status.HTTP_200_OK,
    summary="Búsqueda alfanumérica paginada de entidades",
)
def search_entities(
    db: DBSession,
    current_user: CurrentUser,
    layer_kind: str = Query(..., description="Tipo de capa a consultar (ej. LOTES, MANZANAS)"),
    field: Optional[str] = Query(None, description="Campo específico por el cual filtrar"),
    value: Optional[str] = Query(None, description="Valor alfanumérico a buscar"),
    page: int = Query(1, ge=1, description="Número de página (1-indexed)"),
    page_size: int = Query(10, ge=1, le=100, description="Cantidad de registros por página"),
) -> PaginatedConsultationResponseSchema:
    reader = SqlModelConsultationReader(db)
    query = SearchEntitiesQuery(reader)

    result_dto = query.execute(
        layer_kind=layer_kind,
        field=field,
        value=value,
        page=page,
        page_size=page_size,
    )

    return PaginatedConsultationResponseSchema(
        items=[
            ConsultationRecordSchema(
                id=item.id,
                layer_kind=item.layer_kind,
                code=item.code,
                manzana=item.manzana,
                surface=item.surface,
                status=item.status,
                status_color=item.status_color,
                latitude=item.latitude,
                longitude=item.longitude,
                attributes=item.attributes,
            )
            for item in result_dto.items
        ],
        total=result_dto.total,
        page=result_dto.page,
        page_size=result_dto.page_size,
        total_pages=result_dto.total_pages,
        layer_name=result_dto.layer_name,
    )
