import type {
  AuditLogItem,
  PaginatedAuditLogs,
} from "../../domain/entities/audit-log.entity";
import type {
  AuditLogItemResponseDTO,
  PaginatedAuditLogsResponseDTO,
} from "../schemas/audit-log.schemas";

export const auditLogMapper = {
  toDomainItem(dto: AuditLogItemResponseDTO): AuditLogItem {
    return {
      id: dto.id,
      userId: dto.user_id,
      userName: dto.user_name ?? null,
      userImage: dto.user_image ?? null,
      userEmail: dto.user_email ?? null,
      action: dto.action,
      description: dto.description,
      createdDate: dto.created_date,
    };
  },

  toDomainPaginated(dto: PaginatedAuditLogsResponseDTO): PaginatedAuditLogs {
    return {
      items: dto.items.map(this.toDomainItem),
      total: dto.total,
      page: dto.page,
      pageSize: dto.page_size,
      totalPages: dto.total_pages,
    };
  },
};
