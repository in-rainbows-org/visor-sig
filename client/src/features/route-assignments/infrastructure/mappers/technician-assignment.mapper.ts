import type { TechnicianAssignmentItem } from "../../domain/entities/technician-dashboard.entity";
import type { TechnicianAssignmentReadDTO } from "../schemas/technician-assignment.schemas";

/**
 * Mapper para transformar el payload DTO snake_case de asignaciones del técnico
 * a la entidad de dominio TechnicianAssignmentItem en camelCase.
 */
export const TechnicianAssignmentMapper = {
  toDomain(dto: TechnicianAssignmentReadDTO): TechnicianAssignmentItem {
    return {
      id: dto.id,
      assignmentType: dto.assignment_type,
      status: dto.status,
      scheduledDate: dto.scheduled_date,
      totalStops: dto.total_stops,
      totalDistanceKm: dto.total_distance_km,
      startedAt: dto.started_at ?? null,
      completedAt: dto.completed_at ?? null,
      createdDate: dto.created_date,
    };
  },

  toDomainList(dtos: TechnicianAssignmentReadDTO[]): TechnicianAssignmentItem[] {
    return dtos.map((dto) => this.toDomain(dto));
  },
};
