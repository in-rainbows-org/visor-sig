import math
from typing import Any
import uuid
from sqlalchemy import String, cast, func
from sqlmodel import Session, select

from app.modules.consultations.application.ports.readers.consultation_reader import ConsultationReader
from app.modules.consultations.application.queries.get_codigo_fijo_detail import (
    CodigoFijoDetailDTO,
)
from app.modules.consultations.application.queries.get_codigos_fijos_consultation import (
    CodigoFijoConsultationDTO,
    PaginatedCodigosFijosConsultationDTO,
)
from app.modules.consultations.application.queries.get_lotes_consultation import (
    LoteConsultationDTO,
    PaginatedLotesConsultationDTO,
)
from app.modules.consultations.application.queries.get_manzanas_consultation import (
    ManzanaConsultationDTO,
    PaginatedManzanasConsultationDTO,
)
from app.modules.consultations.application.queries.get_vias_consultation import (
    PaginatedViasConsultationDTO,
    ViaConsultationDTO,
)
from app.modules.layers.domain.enums import LayerKind
from app.modules.layers.infrastructure.persistence.models.codigo_fijo_model import CodigoFijoModel
from app.modules.layers.infrastructure.persistence.models.data_version_model import DataVersionModel
from app.modules.layers.infrastructure.persistence.models.layer_model import LayerModel
from app.modules.layers.infrastructure.persistence.models.lote_model import LoteModel
from app.modules.layers.infrastructure.persistence.models.manzana_model import ManzanaModel
from app.modules.layers.infrastructure.persistence.models.via_model import ViaModel


class SqlModelConsultationReader(ConsultationReader):
    """
    Implementación SQLModel del puerto ConsultationReader para consultas alfanuméricas por capa.
    """

    def __init__(self, session: Session) -> None:
        self.session = session

    def _get_active_version_id(self, layer_kind: str) -> uuid.UUID | None:
        """Obtiene el ID de la versión de datos activa para el tipo de capa especificado."""
        stmt = (
            select(DataVersionModel.id)
            .join(LayerModel, LayerModel.id == DataVersionModel.layer_id)
            .where(
                LayerModel.kind == layer_kind,
                LayerModel.deleted_date.is_(None),
                DataVersionModel.is_active == True,
                DataVersionModel.deleted_date.is_(None),
            )
        )
        return self.session.exec(stmt).first()

    def search_codigos_fijos(
        self,
        fixed_code: int | None,
        name: str | None,
        page: int,
        page_size: int,
    ) -> PaginatedCodigosFijosConsultationDTO:
        """Consulta alfanumérica paginada de códigos fijos con resolución de lote."""
        version_id = self._get_active_version_id(LayerKind.CODIGOS_FIJOS.value)
        if not version_id:
            return PaginatedCodigosFijosConsultationDTO(
                items=[],
                total=0,
                page=page,
                page_size=page_size,
                total_pages=0,
            )

        base_where: list[Any] = [
            CodigoFijoModel.data_version_id == version_id,
            CodigoFijoModel.deleted_date.is_(None),
        ]

        if fixed_code is not None:
            base_where.append(cast(CodigoFijoModel.fixed_code, String).like(f"{fixed_code}%"))

        if name is not None and name.strip():
            base_where.append(CodigoFijoModel.name.ilike(f"%{name.strip()}%"))

        count_stmt = (
            select(func.count(CodigoFijoModel.id))
            .where(*base_where)
        )
        total = self.session.exec(count_stmt).one() or 0
        total_pages = math.ceil(total / page_size) if total > 0 else 0

        if total == 0:
            return PaginatedCodigosFijosConsultationDTO(
                items=[],
                total=0,
                page=page,
                page_size=page_size,
                total_pages=0,
            )

        offset = (page - 1) * page_size
        stmt = (
            select(
                CodigoFijoModel.id,
                CodigoFijoModel.label,
                CodigoFijoModel.fixed_code,
                CodigoFijoModel.name,
                CodigoFijoModel.status,
                LoteModel.lot_number,
            )
            .outerjoin(
                LoteModel,
                (LoteModel.id == CodigoFijoModel.lote_id) & (LoteModel.deleted_date.is_(None)),
            )
            .where(*base_where)
            .order_by(CodigoFijoModel.fixed_code.asc().nulls_last(), CodigoFijoModel.id)
            .offset(offset)
            .limit(page_size)
        )

        rows = self.session.exec(stmt).all()
        items = [
            CodigoFijoConsultationDTO(
                id=r.id,
                label=r.label,
                fixed_code=r.fixed_code,
                name=r.name,
                status=r.status,
                lot_number=r.lot_number,
            )
            for r in rows
        ]

        return PaginatedCodigosFijosConsultationDTO(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )

    def get_codigo_fijo_by_id(self, id: uuid.UUID) -> CodigoFijoDetailDTO | None:
        """Obtiene el detalle georreferenciado completo de un código fijo por ID con lote y manzana."""
        stmt = (
            select(
                CodigoFijoModel.id,
                CodigoFijoModel.label,
                CodigoFijoModel.fixed_code,
                CodigoFijoModel.name,
                CodigoFijoModel.status,
                CodigoFijoModel.latitude,
                CodigoFijoModel.longitude,
                LoteModel.lot_number,
                ManzanaModel.uv,
                ManzanaModel.block_number,
                ManzanaModel.uv_block_code,
            )
            .outerjoin(
                LoteModel,
                (LoteModel.id == CodigoFijoModel.lote_id) & (LoteModel.deleted_date.is_(None)),
            )
            .outerjoin(
                ManzanaModel,
                (ManzanaModel.id == LoteModel.manzana_id) & (ManzanaModel.deleted_date.is_(None)),
            )
            .where(
                CodigoFijoModel.id == id,
                CodigoFijoModel.deleted_date.is_(None),
            )
        )

        row = self.session.exec(stmt).first()
        if not row:
            return None

        return CodigoFijoDetailDTO(
            id=row.id,
            label=row.label,
            fixed_code=row.fixed_code,
            name=row.name,
            status=row.status,
            latitude=row.latitude,
            longitude=row.longitude,
            lot_number=row.lot_number,
            uv=row.uv,
            block_number=row.block_number,
            uv_block_code=row.uv_block_code,
        )

    def search_lotes(
        self,
        lot_number: str | None,
        page: int,
        page_size: int,
    ) -> PaginatedLotesConsultationDTO:
        """Consulta alfanumérica paginada de lotes con resolución de manzana."""
        version_id = self._get_active_version_id(LayerKind.LOTES.value)
        if not version_id:
            return PaginatedLotesConsultationDTO(
                items=[],
                total=0,
                page=page,
                page_size=page_size,
                total_pages=0,
            )

        base_where: list[Any] = [
            LoteModel.data_version_id == version_id,
            LoteModel.deleted_date.is_(None),
        ]

        if lot_number is not None and lot_number.strip():
            base_where.append(LoteModel.lot_number.ilike(f"%{lot_number.strip()}%"))

        count_stmt = select(func.count(LoteModel.id)).where(*base_where)
        total = self.session.exec(count_stmt).one() or 0
        total_pages = math.ceil(total / page_size) if total > 0 else 0

        if total == 0:
            return PaginatedLotesConsultationDTO(
                items=[],
                total=0,
                page=page,
                page_size=page_size,
                total_pages=0,
            )

        offset = (page - 1) * page_size
        stmt = (
            select(
                LoteModel.id,
                LoteModel.lot_number,
                ManzanaModel.uv_block_code,
            )
            .outerjoin(
                ManzanaModel,
                (ManzanaModel.id == LoteModel.manzana_id) & (ManzanaModel.deleted_date.is_(None)),
            )
            .where(*base_where)
            .order_by(LoteModel.lot_number.asc().nulls_last(), LoteModel.id)
            .offset(offset)
            .limit(page_size)
        )

        rows = self.session.exec(stmt).all()
        items = [
            LoteConsultationDTO(
                id=r.id,
                lot_number=r.lot_number,
                manzana_uv_block_code=r.uv_block_code,
            )
            for r in rows
        ]

        return PaginatedLotesConsultationDTO(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )

    def search_manzanas(
        self,
        uv_block_code: str | None,
        uv: str | None,
        block_number: str | None,
        page: int,
        page_size: int,
    ) -> PaginatedManzanasConsultationDTO:
        """Consulta alfanumérica paginada de manzanas catastrales."""
        version_id = self._get_active_version_id(LayerKind.MANZANAS.value)
        if not version_id:
            return PaginatedManzanasConsultationDTO(
                items=[],
                total=0,
                page=page,
                page_size=page_size,
                total_pages=0,
            )

        base_where: list[Any] = [
            ManzanaModel.data_version_id == version_id,
            ManzanaModel.deleted_date.is_(None),
        ]

        if uv_block_code is not None and uv_block_code.strip():
            base_where.append(ManzanaModel.uv_block_code.ilike(f"%{uv_block_code.strip()}%"))

        if uv is not None and uv.strip():
            base_where.append(ManzanaModel.uv.ilike(f"%{uv.strip()}%"))

        if block_number is not None and block_number.strip():
            base_where.append(ManzanaModel.block_number.ilike(f"%{block_number.strip()}%"))

        count_stmt = select(func.count(ManzanaModel.id)).where(*base_where)
        total = self.session.exec(count_stmt).one() or 0
        total_pages = math.ceil(total / page_size) if total > 0 else 0

        if total == 0:
            return PaginatedManzanasConsultationDTO(
                items=[],
                total=0,
                page=page,
                page_size=page_size,
                total_pages=0,
            )

        offset = (page - 1) * page_size
        stmt = (
            select(
                ManzanaModel.id,
                ManzanaModel.uv_block_code,
                ManzanaModel.uv,
                ManzanaModel.block_number,
            )
            .where(*base_where)
            .order_by(ManzanaModel.uv_block_code.asc().nulls_last(), ManzanaModel.id)
            .offset(offset)
            .limit(page_size)
        )

        rows = self.session.exec(stmt).all()
        items = [
            ManzanaConsultationDTO(
                id=r.id,
                uv_block_code=r.uv_block_code,
                uv=r.uv,
                block_number=r.block_number,
            )
            for r in rows
        ]

        return PaginatedManzanasConsultationDTO(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )

    def search_vias(
        self,
        road_type: str | None,
        name: str | None,
        page: int,
        page_size: int,
    ) -> PaginatedViasConsultationDTO:
        """Consulta alfanumérica paginada de vías y calles."""
        version_id = self._get_active_version_id(LayerKind.VIAS.value)
        if not version_id:
            return PaginatedViasConsultationDTO(
                items=[],
                total=0,
                page=page,
                page_size=page_size,
                total_pages=0,
            )

        base_where: list[Any] = [
            ViaModel.data_version_id == version_id,
            ViaModel.deleted_date.is_(None),
        ]

        if road_type is not None and road_type.strip():
            base_where.append(ViaModel.road_type.ilike(f"%{road_type.strip()}%"))

        if name is not None and name.strip():
            base_where.append(ViaModel.name.ilike(f"%{name.strip()}%"))

        count_stmt = select(func.count(ViaModel.id)).where(*base_where)
        total = self.session.exec(count_stmt).one() or 0
        total_pages = math.ceil(total / page_size) if total > 0 else 0

        if total == 0:
            return PaginatedViasConsultationDTO(
                items=[],
                total=0,
                page=page,
                page_size=page_size,
                total_pages=0,
            )

        offset = (page - 1) * page_size
        stmt = (
            select(
                ViaModel.id,
                ViaModel.name,
                ViaModel.reference,
                ViaModel.road_type,
            )
            .where(*base_where)
            .order_by(ViaModel.name.asc().nulls_last(), ViaModel.id)
            .offset(offset)
            .limit(page_size)
        )

        rows = self.session.exec(stmt).all()
        items = [
            ViaConsultationDTO(
                id=r.id,
                name=r.name,
                reference=r.reference,
                road_type=r.road_type,
            )
            for r in rows
        ]

        return PaginatedViasConsultationDTO(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )
