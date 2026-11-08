import logging
from uuid import UUID

import httpx
from sqlmodel import Session, select

from app.modules.layers.infrastructure.persistence.models.codigo_fijo_model import CodigoFijoModel
from app.modules.route_assignments.application.dtos.assignment_detail_dto import (
    AssignmentDetailDTO,
    AssignmentStopDetailItemDTO,
)
from app.modules.route_assignments.application.ports.readers.assignment_detail_reader import (
    AssignmentDetailReader,
)
from app.modules.route_assignments.domain.value_objects.stop_status import StopStatus
from app.modules.route_assignments.infrastructure.external.osrm_route_provider import (
    encode_polyline,
)
from app.modules.route_assignments.infrastructure.persistence.models.assignment_model import (
    AssignmentModel,
)
from app.modules.route_assignments.infrastructure.persistence.models.assignment_stop_model import (
    AssignmentStopModel,
)
from app.shared.infrastructure.db.better_auth import BetterAuthUser

logger = logging.getLogger(__name__)


class SqlModelAssignmentDetailReader(AssignmentDetailReader):
    """Implementación SQLModel del lector de detalle de asignaciones con outer joins eficientes."""

    def __init__(self, session: Session) -> None:
        self.session = session

    def get_by_id(self, assignment_id: UUID) -> AssignmentDetailDTO | None:
        # 1. Consultar la cabecera con el perfil del técnico
        assignment_stmt = (
            select(
                AssignmentModel,
                BetterAuthUser.name,
                BetterAuthUser.image,
            )
            .outerjoin(BetterAuthUser, AssignmentModel.technician_id == BetterAuthUser.id)
            .where(
                AssignmentModel.id == assignment_id,
                AssignmentModel.deleted_date.is_(None),
            )
        )
        assignment_row = self.session.exec(assignment_stmt).first()
        if not assignment_row:
            return None

        assignment, tech_name, tech_image = assignment_row

        # 2. Consultar paradas ordenadas correlativamente con outer join a codigos_fijos
        stops_stmt = (
            select(
                AssignmentStopModel,
                CodigoFijoModel.fixed_code,
                CodigoFijoModel.name,
                CodigoFijoModel.latitude,
                CodigoFijoModel.longitude,
            )
            .outerjoin(CodigoFijoModel, AssignmentStopModel.codigo_fijo_id == CodigoFijoModel.id)
            .where(
                AssignmentStopModel.assignment_id == assignment_id,
                AssignmentStopModel.deleted_date.is_(None),
            )
            .order_by(AssignmentStopModel.order_index.asc())
        )
        stop_rows = self.session.exec(stops_stmt).all()

        # Si alguna parada carece de route_geometry con coordenadas viales, autocalcular con OSRM
        missing_geom = any(
            not stop.route_geometry or not stop.route_geometry.get("coordinates")
            for stop, *_ in stop_rows
        )
        if missing_geom and stop_rows and assignment.start_latitude and assignment.start_longitude:
            self._backfill_missing_geometries(assignment, stop_rows)

        stops: list[AssignmentStopDetailItemDTO] = []
        completed_stops = 0

        for stop, cf_fixed_code, cf_name, cf_lat, cf_lon in stop_rows:
            if stop.status == StopStatus.COMPLETED.value:
                completed_stops += 1

            stops.append(
                AssignmentStopDetailItemDTO(
                    id=stop.id,
                    codigo_fijo_id=stop.codigo_fijo_id,
                    fixed_code=cf_fixed_code,
                    name=cf_name,
                    latitude=cf_lat if cf_lat is not None else 0.0,
                    longitude=cf_lon if cf_lon is not None else 0.0,
                    order_index=stop.order_index,
                    status=stop.status,
                    in_transit_at=stop.in_transit_at,
                    arrived_at=stop.arrived_at,
                    completed_at=stop.completed_at,
                    route_geometry=stop.route_geometry or {},
                )
            )

        return AssignmentDetailDTO(
            id=assignment.id,
            technician_name=tech_name,
            technician_image=tech_image,
            scheduled_date=assignment.scheduled_date,
            started_at=assignment.started_at,
            completed_at=assignment.completed_at,
            status=assignment.status,
            assignment_type=assignment.assignment_type,
            total_stops=assignment.total_stops,
            total_distance_km=assignment.total_distance_km,
            start_latitude=assignment.start_latitude,
            start_longitude=assignment.start_longitude,
            completed_stops=completed_stops,
            stops=tuple(stops),
            technician_id=str(assignment.technician_id),
        )

    def _backfill_missing_geometries(
        self,
        assignment: AssignmentModel,
        stop_rows: list[tuple[AssignmentStopModel, int | None, str | None, float | None, float | None]],
    ) -> None:
        try:
            coords = [f"{assignment.start_longitude},{assignment.start_latitude}"]
            for _, _, _, lat, lon in stop_rows:
                if lat is not None and lon is not None:
                    coords.append(f"{lon},{lat}")
                else:
                    return

            url = f"https://router.project-osrm.org/route/v1/driving/{';'.join(coords)}"
            with httpx.Client(timeout=8.0) as client:
                res = client.get(url, params={"overview": "full", "geometries": "geojson", "steps": "true"})
            if res.status_code != 200:
                return

            data = res.json()
            if data.get("code") != "Ok" or not data.get("routes"):
                return

            legs = data["routes"][0].get("legs", [])
            for idx, (stop, _, _, _, _) in enumerate(stop_rows):
                if idx < len(legs):
                    leg = legs[idx]
                    leg_dist = float(leg.get("distance", 0.0))
                    leg_dur = int(float(leg.get("duration", 0.0)))
                    leg_coords: list[list[float]] = []
                    for step in leg.get("steps", []):
                        step_coords = step.get("geometry", {}).get("coordinates", [])
                        if step_coords:
                            if not leg_coords:
                                leg_coords.extend(step_coords)
                            else:
                                leg_coords.extend(
                                    step_coords[1:] if step_coords[0] == leg_coords[-1] else step_coords
                                )
                    leg_encoded = encode_polyline(leg_coords) if leg_coords else ""
                    stop.route_geometry = {
                        "type": "LineString",
                        "coordinates": leg_coords,
                        "distance_meters": round(leg_dist, 2),
                        "duration_seconds": leg_dur,
                        "polyline": leg_encoded,
                    }
                    self.session.add(stop)
            self.session.commit()
        except Exception as exc:
            logger.warning("No fue posible autocalcular las geometrías viales faltantes: %s", exc)

