import uuid
from fastapi import APIRouter, HTTPException, Query, status

from app.core.dependencies import CurrentUser, DBSession, EventBusDep
from app.modules.consultations.domain.events import ConsultationPerformedEvent
from app.modules.consultations.application.queries.get_codigo_fijo_detail import (
    GetCodigoFijoByIdQuery,
    GetCodigoFijoByIdQueryHandler,
)
from app.modules.consultations.application.queries.get_codigos_fijos_consultation import (
    GetCodigosFijosConsultationQuery,
    GetCodigosFijosConsultationQueryHandler,
)
from app.modules.consultations.application.queries.get_lotes_consultation import (
    GetLotesConsultationQuery,
    GetLotesConsultationQueryHandler,
)
from app.modules.consultations.application.queries.get_manzanas_consultation import (
    GetManzanasConsultationQuery,
    GetManzanasConsultationQueryHandler,
)
from app.modules.consultations.application.queries.get_vias_consultation import (
    GetViasConsultationQuery,
    GetViasConsultationQueryHandler,
)
from app.modules.consultations.infrastructure.api.schemas.consultation_schemas import (
    CodigoFijoConsultationItemSchema,
    CodigoFijoDetailSchema,
    LoteConsultationItemSchema,
    ManzanaConsultationItemSchema,
    PaginatedConsultationResponseSchema,
    ViaConsultationItemSchema,
)
from app.modules.consultations.infrastructure.persistence.readers.sqlmodel_consultation_reader import (
    SqlModelConsultationReader,
)

router = APIRouter(prefix="/consultations", tags=["Consultations"])


@router.get(
    "/codigos-fijos",
    response_model=PaginatedConsultationResponseSchema[CodigoFijoConsultationItemSchema],
    status_code=status.HTTP_200_OK,
    summary="Consulta alfanumérica paginada de Códigos Fijos",
)
def get_codigos_fijos_consultation(
    db: DBSession,
    user: CurrentUser,
    event_bus: EventBusDep,
    fixed_code: int | None = Query(None, description="Código fijo exacto o prefijo"),
    name: str | None = Query(None, description="Nombre del titular o abonado"),
    page: int = Query(1, ge=1, description="Número de página (1-indexed)"),
    page_size: int = Query(10, ge=1, le=100, description="Cantidad de registros por página"),
) -> PaginatedConsultationResponseSchema[CodigoFijoConsultationItemSchema]:
    reader = SqlModelConsultationReader(db)
    handler = GetCodigosFijosConsultationQueryHandler(reader)
    result = handler.execute(
        GetCodigosFijosConsultationQuery(
            fixed_code=fixed_code,
            name=name,
            page=page,
            page_size=page_size,
        )
    )

    filter_desc = "código" if fixed_code is not None else ("nombre" if name else "general")
    val_desc = str(fixed_code) if fixed_code is not None else (name or "todos")
    event_bus.publish(
        ConsultationPerformedEvent(
            user_id=user.id,
            layer_name="Códigos Fijos",
            filter_type=filter_desc,
            query_value=val_desc,
        )
    )

    return PaginatedConsultationResponseSchema(
        items=[
            CodigoFijoConsultationItemSchema(
                id=item.id,
                label=item.label,
                fixed_code=item.fixed_code,
                name=item.name,
                status=item.status,
                lot_number=item.lot_number,
            )
            for item in result.items
        ],
        total=result.total,
        page=result.page,
        page_size=result.page_size,
        total_pages=result.total_pages,
    )


@router.get(
    "/codigos-fijos/{id}",
    response_model=CodigoFijoDetailSchema,
    status_code=status.HTTP_200_OK,
    summary="Detalle georreferenciado de un Código Fijo por ID",
)
def get_codigo_fijo_detail(
    id: uuid.UUID,
    db: DBSession,
    _: CurrentUser,
) -> CodigoFijoDetailSchema:
    reader = SqlModelConsultationReader(db)
    handler = GetCodigoFijoByIdQueryHandler(reader)
    result = handler.execute(GetCodigoFijoByIdQuery(id=id))

    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Código fijo no encontrado",
        )

    return CodigoFijoDetailSchema(
        id=result.id,
        label=result.label,
        fixed_code=result.fixed_code,
        name=result.name,
        status=result.status,
        latitude=result.latitude,
        longitude=result.longitude,
        lot_number=result.lot_number,
        uv=result.uv,
        block_number=result.block_number,
        uv_block_code=result.uv_block_code,
    )


@router.get(
    "/lotes",
    response_model=PaginatedConsultationResponseSchema[LoteConsultationItemSchema],
    status_code=status.HTTP_200_OK,
    summary="Consulta alfanumérica paginada de Lotes",
)
def get_lotes_consultation(
    db: DBSession,
    user: CurrentUser,
    event_bus: EventBusDep,
    lot_number: str | None = Query(None, description="Número o código de lote"),
    page: int = Query(1, ge=1, description="Número de página (1-indexed)"),
    page_size: int = Query(10, ge=1, le=100, description="Cantidad de registros por página"),
) -> PaginatedConsultationResponseSchema[LoteConsultationItemSchema]:
    reader = SqlModelConsultationReader(db)
    handler = GetLotesConsultationQueryHandler(reader)
    result = handler.execute(
        GetLotesConsultationQuery(
            lot_number=lot_number,
            page=page,
            page_size=page_size,
        )
    )

    event_bus.publish(
        ConsultationPerformedEvent(
            user_id=user.id,
            layer_name="Lotes",
            filter_type="lote" if lot_number else "general",
            query_value=lot_number or "todos",
        )
    )

    return PaginatedConsultationResponseSchema(
        items=[
            LoteConsultationItemSchema(
                id=item.id,
                lot_number=item.lot_number,
                manzana_uv_block_code=item.manzana_uv_block_code,
            )
            for item in result.items
        ],
        total=result.total,
        page=result.page,
        page_size=result.page_size,
        total_pages=result.total_pages,
    )


@router.get(
    "/manzanas",
    response_model=PaginatedConsultationResponseSchema[ManzanaConsultationItemSchema],
    status_code=status.HTTP_200_OK,
    summary="Consulta alfanumérica paginada de Manzanas",
)
def get_manzanas_consultation(
    db: DBSession,
    user: CurrentUser,
    event_bus: EventBusDep,
    uv_block_code: str | None = Query(None, description="Código UV-Manzana (ej. UV01-MZ02)"),
    uv: str | None = Query(None, description="Unidad vecinal (ej. UV01)"),
    block_number: str | None = Query(None, description="Número de manzana"),
    page: int = Query(1, ge=1, description="Número de página (1-indexed)"),
    page_size: int = Query(10, ge=1, le=100, description="Cantidad de registros por página"),
) -> PaginatedConsultationResponseSchema[ManzanaConsultationItemSchema]:
    reader = SqlModelConsultationReader(db)
    handler = GetManzanasConsultationQueryHandler(reader)
    result = handler.execute(
        GetManzanasConsultationQuery(
            uv_block_code=uv_block_code,
            uv=uv,
            block_number=block_number,
            page=page,
            page_size=page_size,
        )
    )

    filter_desc = "código uv-manzana" if uv_block_code else ("manzana" if block_number else ("uv" if uv else "general"))
    val_desc = uv_block_code or block_number or uv or "todos"
    event_bus.publish(
        ConsultationPerformedEvent(
            user_id=user.id,
            layer_name="Manzanas",
            filter_type=filter_desc,
            query_value=val_desc,
        )
    )

    return PaginatedConsultationResponseSchema(
        items=[
            ManzanaConsultationItemSchema(
                id=item.id,
                uv_block_code=item.uv_block_code,
                uv=item.uv,
                block_number=item.block_number,
            )
            for item in result.items
        ],
        total=result.total,
        page=result.page,
        page_size=result.page_size,
        total_pages=result.total_pages,
    )


@router.get(
    "/vias",
    response_model=PaginatedConsultationResponseSchema[ViaConsultationItemSchema],
    status_code=status.HTTP_200_OK,
    summary="Consulta alfanumérica paginada de Vías",
)
def get_vias_consultation(
    db: DBSession,
    user: CurrentUser,
    event_bus: EventBusDep,
    road_type: str | None = Query(None, description="Tipo de vía (ej. Avenida, Calle)"),
    name: str | None = Query(None, description="Nombre de la vía"),
    page: int = Query(1, ge=1, description="Número de página (1-indexed)"),
    page_size: int = Query(10, ge=1, le=100, description="Cantidad de registros por página"),
) -> PaginatedConsultationResponseSchema[ViaConsultationItemSchema]:
    reader = SqlModelConsultationReader(db)
    handler = GetViasConsultationQueryHandler(reader)
    result = handler.execute(
        GetViasConsultationQuery(
            road_type=road_type,
            name=name,
            page=page,
            page_size=page_size,
        )
    )

    filter_desc = "nombre" if name else ("tipo" if road_type else "general")
    val_desc = name or road_type or "todos"
    event_bus.publish(
        ConsultationPerformedEvent(
            user_id=user.id,
            layer_name="Vías",
            filter_type=filter_desc,
            query_value=val_desc,
        )
    )

    return PaginatedConsultationResponseSchema(
        items=[
            ViaConsultationItemSchema(
                id=item.id,
                name=item.name,
                reference=item.reference,
                road_type=item.road_type,
            )
            for item in result.items
        ],
        total=result.total,
        page=result.page,
        page_size=result.page_size,
        total_pages=result.total_pages,
    )
