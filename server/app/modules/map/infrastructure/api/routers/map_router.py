import re
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, status

from app.core.dependencies import CurrentUser, DBSession
from app.modules.map.application.queries.get_active_map_features import GetActiveMapFeaturesQuery
from app.modules.map.infrastructure.api.schemas.map_schemas import MapFeaturesResponseSchema
from app.modules.map.infrastructure.persistence.readers.sqlmodel_active_map_features_reader import (
    SqlModelActiveMapFeaturesReader,
)
from app.modules.layers.domain.enums import LayerKind

router = APIRouter(prefix="/map", tags=["Map"])

BBOX_REGEX = re.compile(r"^-?\d+(?:\.\d+)?,-?\d+(?:\.\d+)?,-?\d+(?:\.\d+)?,-?\d+(?:\.\d+)?$")


@router.get(
    "/features",
    response_model=MapFeaturesResponseSchema,
    status_code=status.HTTP_200_OK,
    summary="Obtener features activos de capas geográficas por viewport",
)
def get_active_map_features(
    db: DBSession,
    current_user: CurrentUser,
    layer_kinds: List[LayerKind] = Query(..., description="Capas a consultar"),
    bbox: str = Query(..., description="Bounding box en formato west,south,east,north en EPSG:4326"),
    zoom: int = Query(..., ge=1, le=20, description="Nivel de zoom del mapa (1-20)"),
    fixed_code_statuses: Optional[List[int]] = Query(None, description="Estados de códigos fijos (1-5)"),
) -> MapFeaturesResponseSchema:
    if not BBOX_REGEX.match(bbox):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Formato de bbox inválido. Debe ser 'west,south,east,north' con coordenadas válidas.",
        )

    try:
        parts = [float(p.strip()) for p in bbox.split(",")]
        west, south, east, north = parts[0], parts[1], parts[2], parts[3]
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Error al procesar las coordenadas del bbox.",
        )

    if west >= east or south >= north:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Coordenadas de bbox inconsistentes: west debe ser menor que east y south menor que north.",
        )

    if west < -180 or east > 180 or south < -90 or north > 90:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Coordenadas de bbox fuera de los rangos válidos de EPSG:4326 (-180 a 180, -90 a 90).",
        )

    reader = SqlModelActiveMapFeaturesReader(db)
    query = GetActiveMapFeaturesQuery(reader)

    result_dto = query.execute(
        layer_kinds=layer_kinds,
        west=west,
        south=south,
        east=east,
        north=north,
        zoom=zoom,
        fixed_code_statuses=fixed_code_statuses,
    )

    return MapFeaturesResponseSchema.model_validate(result_dto.model_dump())
