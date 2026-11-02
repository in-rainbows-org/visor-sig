from datetime import date

from sqlalchemy import func
from sqlmodel import Session, select

from app.modules.route_assignments.application.dtos.assignment_summary_dto import (
    AssignmentSummaryDTO,
    PaginatedAssignmentsDTO,
    TechnicianOptionDTO,
)
from app.modules.route_assignments.application.ports.readers.assignment_summary_reader import (
    AssignmentSummaryReader,
)
from app.modules.route_assignments.infrastructure.persistence.models.assignment_model import (
    AssignmentModel,
)
from app.shared.infrastructure.db.better_auth import BetterAuthUser


class SqlModelAssignmentSummaryReader(AssignmentSummaryReader):
    """Implementación SQLModel del lector de asignaciones con outer join a BetterAuthUser."""

    def __init__(self, session: Session) -> None:
        self.session = session

    def get_paginated(
        self,
        page: int,
        page_size: int,
        technician_id: str | None = None,
        scheduled_date_from: date | None = None,
        scheduled_date_to: date | None = None,
    ) -> PaginatedAssignmentsDTO:
        clamped_page = max(1, page)
        clamped_page_size = max(1, min(100, page_size))
        offset = (clamped_page - 1) * clamped_page_size

        filters = [AssignmentModel.deleted_date.is_(None)]

        if technician_id:
            filters.append(AssignmentModel.technician_id == technician_id.strip())

        if scheduled_date_from is not None and scheduled_date_to is not None:
            filters.append(AssignmentModel.scheduled_date >= scheduled_date_from)
            filters.append(AssignmentModel.scheduled_date <= scheduled_date_to)

        # 1. Conteo total de coincidencias
        total_stmt = select(func.count(AssignmentModel.id)).where(*filters)
        total = self.session.exec(total_stmt).one()

        # 2. Registros paginados con outer join hacia la tabla de usuarios
        stmt = (
            select(
                AssignmentModel,
                BetterAuthUser.name,
                BetterAuthUser.image,
                BetterAuthUser.email,
            )
            .outerjoin(BetterAuthUser, AssignmentModel.technician_id == BetterAuthUser.id)
            .where(*filters)
            .order_by(AssignmentModel.created_date.desc())
            .offset(offset)
            .limit(clamped_page_size)
        )
        rows = self.session.exec(stmt).all()

        items = [
            AssignmentSummaryDTO(
                id=assignment.id,
                technician_id=assignment.technician_id,
                technician_name=u_name,
                technician_image=u_image,
                technician_email=u_email,
                total_stops=assignment.total_stops,
                scheduled_date=assignment.scheduled_date,
                assignment_type=assignment.assignment_type,
                status=assignment.status,
                created_date=assignment.created_date,
            )
            for assignment, u_name, u_image, u_email in rows
        ]

        total_pages = (total + clamped_page_size - 1) // clamped_page_size if total > 0 else 0

        return PaginatedAssignmentsDTO(
            items=items,
            total=total,
            page=clamped_page,
            page_size=clamped_page_size,
            total_pages=total_pages,
        )

    def list_technicians(self) -> list[TechnicianOptionDTO]:
        stmt = (
            select(BetterAuthUser)
            .where(func.upper(BetterAuthUser.role) == "TECHNICIAN")
            .where((BetterAuthUser.banned.is_(False)) | (BetterAuthUser.banned.is_(None)))
            .order_by(BetterAuthUser.name.asc())
        )
        users = self.session.exec(stmt).all()
        return [
            TechnicianOptionDTO(
                id=u.id,
                name=u.name,
                email=u.email,
                image=u.image,
            )
            for u in users
        ]
