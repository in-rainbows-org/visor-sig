import type {
  AssignmentDetail,
  AssignmentStopDetail,
} from "../../domain/entities/assignment-detail.entity";
import type {
  AssignmentDetailReadDTO,
  AssignmentStopDetailReadDTO,
} from "../schemas/assignment-detail.schemas";

import { decodePolyline } from "../utils/polyline-decoder";

/**
 * Extrae las coordenadas de un GeoJSON LineString y las invierte de [lon, lat] a [lat, lon] para Leaflet,
 * o decodifica la polilínea codificada si está presente.
 */
function extractLeafletCoordinates(geometry: Record<string, unknown> | null | undefined): [number, number][] {
  if (!geometry || typeof geometry !== "object") return [];

  if (geometry.type === "LineString" && Array.isArray(geometry.coordinates)) {
    const coords = (geometry.coordinates as unknown[])
      .filter((pair): pair is [number, number] => Array.isArray(pair) && pair.length >= 2)
      .map(([lon, lat]) => [Number(lat), Number(lon)] as [number, number]);
    if (coords.length > 0) return coords;
  }

  if (typeof geometry.polyline === "string" && geometry.polyline.length > 0) {
    return decodePolyline(geometry.polyline);
  }

  return [];
}

/**
 * Mapper que transforma los DTOs en snake_case devueltos por el backend
 * a las entidades de dominio puro en camelCase.
 */
export const AssignmentDetailMapper = {
  toStopDomain(dto: AssignmentStopDetailReadDTO): AssignmentStopDetail {
    return {
      id: dto.id,
      codigoFijoId: dto.codigo_fijo_id,
      fixedCode: dto.fixed_code ?? null,
      name: dto.name ?? null,
      latitude: dto.latitude,
      longitude: dto.longitude,
      orderIndex: dto.order_index,
      status: dto.status,
      inTransitAt: dto.in_transit_at ? new Date(dto.in_transit_at) : null,
      arrivedAt: dto.arrived_at ? new Date(dto.arrived_at) : null,
      completedAt: dto.completed_at ? new Date(dto.completed_at) : null,
      routeGeometry: dto.route_geometry ?? {},
      coordinates: extractLeafletCoordinates(dto.route_geometry),
      meterReading: dto.meter_reading ?? null,
      evidencePhotoUrl: dto.evidence_photo_url ?? null,
      observation: dto.observation ?? null,
    };
  },

  toDomain(dto: AssignmentDetailReadDTO): AssignmentDetail {
    return {
      id: dto.id,
      technicianName: dto.technician_name ?? null,
      technicianImage: dto.technician_image ?? null,
      scheduledDate: dto.scheduled_date,
      startedAt: dto.started_at ? new Date(dto.started_at) : null,
      completedAt: dto.completed_at ? new Date(dto.completed_at) : null,
      status: dto.status,
      assignmentType: dto.assignment_type,
      totalStops: dto.total_stops,
      totalDistanceKm: dto.total_distance_km,
      startLatitude: dto.start_latitude,
      startLongitude: dto.start_longitude,
      completedStops: dto.completed_stops,
      stops: dto.stops.map((stopDto) => AssignmentDetailMapper.toStopDomain(stopDto)),
    };
  },
};
