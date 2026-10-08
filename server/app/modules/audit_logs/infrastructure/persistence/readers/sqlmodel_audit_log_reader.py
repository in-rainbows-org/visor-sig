from sqlalchemy import func
from sqlmodel import Session, select

from app.modules.audit_logs.application.dtos.audit_log_dtos import (
    AuditLogItemDTO,
    PaginatedAuditLogsDTO,
)
from app.modules.audit_logs.application.ports.readers.audit_log_reader import (
    AuditLogReader,
)
from app.modules.audit_logs.infrastructure.persistence.models.audit_log_model import (
    AuditLogModel,
)
from app.shared.infrastructure.db.better_auth import BetterAuthUser


class SqlModelAuditLogReader(AuditLogReader):
    """
    Implementación SQLModel del lector de bitácora uniendo con los perfiles de BetterAuthUser.
    """

    def __init__(self, session: Session) -> None:
        self.session = session

    def get_paginated(
        self,
        page: int,
        page_size: int,
    ) -> PaginatedAuditLogsDTO:
        clamped_page = max(1, page)
        clamped_page_size = max(1, min(100, page_size))
        offset = (clamped_page - 1) * clamped_page_size

        # 1. Total de registros
        total_stmt = select(func.count(AuditLogModel.id))
        total = self.session.exec(total_stmt).one()

        # 2. Registros paginados con outer join hacia la tabla de usuarios de Better Auth
        stmt = (
            select(
                AuditLogModel,
                BetterAuthUser.name,
                BetterAuthUser.image,
                BetterAuthUser.email,
            )
            .outerjoin(BetterAuthUser, AuditLogModel.user_id == BetterAuthUser.id)
            .order_by(AuditLogModel.created_date.desc())
            .offset(offset)
            .limit(clamped_page_size)
        )
        rows = self.session.exec(stmt).all()

        items = [
            AuditLogItemDTO(
                id=log.id,
                user_id=log.user_id,
                user_name=user_name,
                user_image=user_image,
                user_email=user_email,
                action=log.action,
                description=log.description,
                created_date=log.created_date,
            )
            for log, user_name, user_image, user_email in rows
        ]

        total_pages = (total + clamped_page_size - 1) // clamped_page_size if total > 0 else 0

        return PaginatedAuditLogsDTO(
            items=items,
            total=total,
            page=clamped_page,
            page_size=clamped_page_size,
            total_pages=total_pages,
        )
