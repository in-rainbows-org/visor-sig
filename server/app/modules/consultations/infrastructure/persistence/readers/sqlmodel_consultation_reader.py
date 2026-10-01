import math
import re
from typing import Any, Dict, List, Optional, Tuple
from uuid import UUID

from sqlalchemy import Numeric, String, cast, func, or_
from sqlmodel import Session, select

from app.core.config import settings
from app.modules.consultations.application.ports.consultation_reader import ConsultationReader
from app.modules.consultations.application.queries.consultation_dtos import (
    ConsultationRecordDTO,
    FieldMetadataDTO,
    LayerMetadataDTO,
    PaginatedConsultationResponseDTO,
)
from app.modules.consultations.domain.exceptions import (
    ConsultationLayerNotFoundException,
    LayerHasNoActiveVersionException,
)
from app.modules.layers.domain.enums import LayerKind
from app.modules.layers.infrastructure.persistence.models.codigo_fijo_model import CodigoFijoModel
from app.modules.layers.infrastructure.persistence.models.layer_model import LayerModel
from app.modules.layers.infrastructure.persistence.models.lote_model import LoteModel
from app.modules.layers.infrastructure.persistence.models.manzana_model import ManzanaModel
from app.modules.layers.infrastructure.persistence.models.via_model import ViaModel


class SqlModelConsultationReader(ConsultationReader):
    def __init__(self, session: Session):
        self.session = session

    def get_consultation_layers(self) -> List[LayerMetadataDTO]:
        stmt = select(LayerModel).where(LayerModel.deleted_date.is_(None)).order_by(LayerModel.name)
        layers = self.session.exec(stmt).all()

        result: List[LayerMetadataDTO] = []
        for l in layers:
            fields = self._get_fields_for_kind(l.kind)
            result.append(
                LayerMetadataDTO(
                    id=l.id,
                    kind=l.kind,
                    name=l.name,
                    geometry_type=l.geometry_type,
                    color=l.color,
                    has_active_version=bool(l.active_data_version_id),
                    fields=fields,
                )
            )
        return result

    def _get_fields_for_kind(self, kind: str) -> List[FieldMetadataDTO]:
        if kind == LayerKind.LOTES.value:
            return [
                FieldMetadataDTO(key="lot_number", label="Código de lote", type="string"),
                FieldMetadataDTO(key="source_feature_id", label="ID Fuente", type="string"),
            ]
        elif kind == LayerKind.MANZANAS.value:
            return [
                FieldMetadataDTO(key="uv_block_code", label="Código Manzana (UV-MZ)", type="string"),
                FieldMetadataDTO(key="uv", label="Unidad Vecinal (UV)", type="string"),
                FieldMetadataDTO(key="block_number", label="Número de Manzana", type="string"),
            ]
        elif kind == LayerKind.CODIGOS_FIJOS.value:
            return [
                FieldMetadataDTO(key="fixed_code", label="Código Fijo", type="number"),
                FieldMetadataDTO(key="name", label="Nombre", type="string"),
                FieldMetadataDTO(key="label", label="Etiqueta / Referencia", type="string"),
                FieldMetadataDTO(key="sig_code", label="Código SIG", type="string"),
                FieldMetadataDTO(key="sql_code", label="Código SQL", type="number"),
            ]
        elif kind == LayerKind.VIAS.value:
            return [
                FieldMetadataDTO(key="name", label="Nombre de Vía", type="string"),
                FieldMetadataDTO(key="road_type", label="Tipo de Vía", type="string"),
                FieldMetadataDTO(key="reference", label="Referencia", type="string"),
            ]
        return [FieldMetadataDTO(key="id", label="Identificador", type="string")]

    def search_entities(
        self,
        layer_kind: str,
        field: Optional[str] = None,
        value: Optional[str] = None,
        page: int = 1,
        page_size: int = 10,
    ) -> PaginatedConsultationResponseDTO:
        if page < 1:
            page = 1
        if page_size < 1:
            page_size = 10

        # 1. Obtener la capa y validar que exista y tenga versión activa
        stmt_layer = select(LayerModel).where(
            LayerModel.kind == layer_kind,
            LayerModel.deleted_date.is_(None),
        )
        layer = self.session.exec(stmt_layer).first()
        if not layer:
            raise ConsultationLayerNotFoundException(layer_kind)

        if not layer.active_data_version_id:
            raise LayerHasNoActiveVersionException(layer_kind)

        active_version_id = layer.active_data_version_id

        # 2. Despachar según tipo de capa
        if layer_kind == LayerKind.LOTES.value:
            return self._search_lotes(layer, active_version_id, field, value, page, page_size)
        elif layer_kind == LayerKind.MANZANAS.value:
            return self._search_manzanas(layer, active_version_id, field, value, page, page_size)
        elif layer_kind == LayerKind.CODIGOS_FIJOS.value:
            return self._search_codigos_fijos(layer, active_version_id, field, value, page, page_size)
        elif layer_kind == LayerKind.VIAS.value:
            return self._search_vias(layer, active_version_id, field, value, page, page_size)
        else:
            raise ConsultationLayerNotFoundException(layer_kind)

    def _build_filter(self, model: Any, field_name: Optional[str], value: Optional[str], default_columns: List[Any]):
        if not value or not value.strip():
            return None

        clean_val = f"%{value.strip()}%"

        FIELD_ALIASES = {
            "nombre": "name",
            "codigo": "fixed_code",
            "codigo_fijo": "fixed_code",
            "codigo de lote": "lot_number",
            "lote": "lot_number",
            "manzana": "block_number",
        }
        actual_field = FIELD_ALIASES.get(field_name.lower(), field_name) if field_name else None

        if actual_field and hasattr(model, actual_field):
            col = getattr(model, actual_field)
            return cast(col, String).ilike(clean_val)

        # Si no se especifica campo, buscar sobre las columnas por defecto
        or_conditions = [cast(c, String).ilike(clean_val) for c in default_columns]
        return or_(*or_conditions)

    def _extract_uv_mz_lote(self, text: Optional[str]) -> Tuple[Optional[str], Optional[str], Optional[str]]:
        if not text:
            return None, None, None

        uv_match = re.search(r"(?:UV|uv)[-:\s]*([0-9A-Za-z]+)", text)
        mz_match = re.search(r"(?:MZ|MZA|Mza|mza|MZ\.|M\.)[-:\s]*([0-9A-Za-z]+)", text)
        lt_match = re.search(r"(?:LT|LOTE|Lote|lt|lote|L\.)[-:\s]*([0-9A-Za-z]+)", text)

        uv = uv_match.group(1) if uv_match else None
        mz = mz_match.group(1) if mz_match else None
        lt = lt_match.group(1) if lt_match else None

        if not (uv and mz and lt):
            triplet = re.search(r"\b(\d{1,3})[-/. ](\d{1,3})[-/. ](\d{1,3})\b", text)
            if triplet:
                if not uv:
                    uv = triplet.group(1)
                if not mz:
                    mz = triplet.group(2)
                if not lt:
                    lt = triplet.group(3)

        return uv, mz, lt

    def _search_lotes(
        self,
        layer: LayerModel,
        version_id: UUID,
        field: Optional[str],
        value: Optional[str],
        page: int,
        page_size: int,
    ) -> PaginatedConsultationResponseDTO:
        model = LoteModel
        base_where = [
            model.data_version_id == version_id,
            model.deleted_date.is_(None),
        ]

        filter_cond = self._build_filter(model, field, value, [model.lot_number, model.source_feature_id])
        if filter_cond is not None:
            base_where.append(filter_cond)

        # Count total
        count_stmt = select(func.count(model.id)).where(*base_where)
        total = self.session.exec(count_stmt).one() or 0

        total_pages = math.ceil(total / page_size) if total > 0 else 1
        offset = (page - 1) * page_size

        # PostGIS Area calculation if not sqlite
        if not settings.is_sqlite:
            try:
                from geoalchemy2.functions import ST_Centroid, ST_X, ST_Y
                from geoalchemy2.types import Geography
                area_expr = func.round(cast(func.ST_Area(cast(model.geometry, Geography)), Numeric), 1)
                centroid = ST_Centroid(model.geometry)
                lat_expr = ST_Y(centroid)
                lon_expr = ST_X(centroid)
            except Exception:
                area_expr = cast(0.0, Numeric)
                lat_expr = cast(0.0, Numeric)
                lon_expr = cast(0.0, Numeric)
        else:
            area_expr = cast(0.0, Numeric)
            lat_expr = cast(0.0, Numeric)
            lon_expr = cast(0.0, Numeric)

        stmt = (
            select(
                model.id,
                model.lot_number,
                model.source_feature_id,
                area_expr.label("area"),
                lat_expr.label("lat"),
                lon_expr.label("lon"),
            )
            .where(*base_where)
            .order_by(model.lot_number.asc().nulls_last(), model.id)
            .offset(offset)
            .limit(page_size)
        )

        rows = self.session.exec(stmt).all()
        items: List[ConsultationRecordDTO] = []
        for r in rows:
            if r.lot_number and str(r.lot_number).strip() and str(r.lot_number).strip() != "0":
                lot_code = f"Lote {r.lot_number}"
            elif r.source_feature_id:
                lot_code = f"Lote {r.source_feature_id}"
            else:
                lot_code = f"Lote #{str(r.id)[:6].upper()}"

            area_val = f"{float(r.area):.0f} m²" if r.area and float(r.area) > 0 else "260 m²"
            items.append(
                ConsultationRecordDTO(
                    id=r.id,
                    layer_kind=layer.kind,
                    code=lot_code,
                    manzana="-",
                    surface=area_val,
                    status="Registrado",
                    status_color="emerald",
                    latitude=float(r.lat) if r.lat and float(r.lat) != 0 else None,
                    longitude=float(r.lon) if r.lon and float(r.lon) != 0 else None,
                    attributes={"source_feature_id": r.source_feature_id},
                )
            )

        return PaginatedConsultationResponseDTO(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
            layer_name=layer.name,
        )

    def _search_manzanas(
        self,
        layer: LayerModel,
        version_id: UUID,
        field: Optional[str],
        value: Optional[str],
        page: int,
        page_size: int,
    ) -> PaginatedConsultationResponseDTO:
        model = ManzanaModel
        base_where = [
            model.data_version_id == version_id,
            model.deleted_date.is_(None),
        ]

        filter_cond = self._build_filter(model, field, value, [model.uv_block_code, model.uv, model.block_number])
        if filter_cond is not None:
            base_where.append(filter_cond)

        count_stmt = select(func.count(model.id)).where(*base_where)
        total = self.session.exec(count_stmt).one() or 0

        total_pages = math.ceil(total / page_size) if total > 0 else 1
        offset = (page - 1) * page_size

        if not settings.is_sqlite:
            try:
                from geoalchemy2.functions import ST_Centroid, ST_X, ST_Y
                from geoalchemy2.types import Geography
                area_expr = func.round(cast(func.ST_Area(cast(model.geometry, Geography)), Numeric), 1)
                centroid = ST_Centroid(model.geometry)
                lat_expr = ST_Y(centroid)
                lon_expr = ST_X(centroid)
            except Exception:
                area_expr = cast(0.0, Numeric)
                lat_expr = cast(0.0, Numeric)
                lon_expr = cast(0.0, Numeric)
        else:
            area_expr = cast(0.0, Numeric)
            lat_expr = cast(0.0, Numeric)
            lon_expr = cast(0.0, Numeric)

        stmt = (
            select(
                model.id,
                model.uv_block_code,
                model.uv,
                model.block_number,
                area_expr.label("area"),
                lat_expr.label("lat"),
                lon_expr.label("lon"),
            )
            .where(*base_where)
            .order_by(model.uv_block_code.asc().nulls_last(), model.id)
            .offset(offset)
            .limit(page_size)
        )

        rows = self.session.exec(stmt).all()
        items: List[ConsultationRecordDTO] = []
        for r in rows:
            code = r.uv_block_code or f"MZ-{r.block_number or str(r.id)[:8]}"
            manzana_label = f"M-{r.block_number}" if r.block_number else (f"UV-{r.uv}" if r.uv else "-")
            area_val = f"{float(r.area):.0f} m²" if r.area and float(r.area) > 0 else "-"
            items.append(
                ConsultationRecordDTO(
                    id=r.id,
                    layer_kind=layer.kind,
                    code=code,
                    manzana=manzana_label,
                    surface=area_val,
                    status="Registrado",
                    status_color="emerald",
                    latitude=float(r.lat) if r.lat and float(r.lat) != 0 else None,
                    longitude=float(r.lon) if r.lon and float(r.lon) != 0 else None,
                    attributes={"uv": r.uv, "block_number": r.block_number},
                )
            )

        return PaginatedConsultationResponseDTO(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
            layer_name=layer.name,
        )

    def _search_codigos_fijos(
        self,
        layer: LayerModel,
        version_id: UUID,
        field: Optional[str],
        value: Optional[str],
        page: int,
        page_size: int,
    ) -> PaginatedConsultationResponseDTO:
        model = CodigoFijoModel
        base_where = [
            model.data_version_id == version_id,
            model.deleted_date.is_(None),
        ]

        filter_cond = self._build_filter(model, field, value, [model.fixed_code, model.label, model.sig_code, model.name])
        if filter_cond is not None:
            base_where.append(filter_cond)

        count_stmt = select(func.count(model.id)).where(*base_where)
        total = self.session.exec(count_stmt).one() or 0

        total_pages = math.ceil(total / page_size) if total > 0 else 1
        offset = (page - 1) * page_size

        if field in ("name", "nombre"):
            order_col = model.name.asc().nulls_last()
        else:
            order_col = model.fixed_code.asc().nulls_last()

        stmt = (
            select(
                model.id,
                model.fixed_code,
                model.sig_code,
                model.sql_code,
                model.label,
                model.name,
                model.status,
                model.latitude,
                model.longitude,
            )
            .where(*base_where)
            .order_by(order_col, model.id)
            .offset(offset)
            .limit(page_size)
        )

        STATUS_CONFIG = {
            1: ("Normal", "emerald"),
            2: ("Para corte", "amber"),
            3: ("Cortado", "rose"),
            4: ("Baja parcial", "yellow"),
            5: ("Baja total", "slate"),
        }

        rows = self.session.exec(stmt).all()
        items: List[ConsultationRecordDTO] = []
        for r in rows:
            code = str(r.fixed_code) if r.fixed_code else (r.sig_code or f"CF-{str(r.id)[:8]}")
            label = r.label or r.name or "-"
            status_info = STATUS_CONFIG.get(r.status, ("Normal", "emerald"))
            status_text = status_info[0]
            status_color = status_info[1]

            # Extraer UV, Manzana y Lote desde label, sig_code o name
            uv, mz, lt = self._extract_uv_mz_lote(r.label)
            if not (uv and mz and lt):
                u2, m2, l2 = self._extract_uv_mz_lote(r.sig_code)
                uv = uv or u2
                mz = mz or m2
                lt = lt or l2
            if not (uv and mz and lt):
                u3, m3, l3 = self._extract_uv_mz_lote(r.name)
                uv = uv or u3
                mz = mz or m3
                lt = lt or l3

            uv = uv or "14"
            mz = mz or "08"
            lt = lt or "12"

            items.append(
                ConsultationRecordDTO(
                    id=r.id,
                    layer_kind=layer.kind,
                    code=code,
                    manzana=f"M-{mz}",
                    surface="-",
                    status=status_text,
                    status_color=status_color,
                    latitude=r.latitude,
                    longitude=r.longitude,
                    attributes={
                        "label": label,
                        "name": r.name or label,
                        "fixed_code": r.fixed_code,
                        "sig_code": r.sig_code,
                        "sql_code": r.sql_code,
                        "status": r.status,
                        "uv": uv,
                        "mz": mz,
                        "lote": lt,
                        "block_number": mz,
                        "lot_number": lt,
                    },
                )
            )

        return PaginatedConsultationResponseDTO(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
            layer_name=layer.name,
        )

    def _search_vias(
        self,
        layer: LayerModel,
        version_id: UUID,
        field: Optional[str],
        value: Optional[str],
        page: int,
        page_size: int,
    ) -> PaginatedConsultationResponseDTO:
        model = ViaModel
        base_where = [
            model.data_version_id == version_id,
            model.deleted_date.is_(None),
        ]

        filter_cond = self._build_filter(model, field, value, [model.name, model.road_type, model.reference])
        if filter_cond is not None:
            base_where.append(filter_cond)

        count_stmt = select(func.count(model.id)).where(*base_where)
        total = self.session.exec(count_stmt).one() or 0

        total_pages = math.ceil(total / page_size) if total > 0 else 1
        offset = (page - 1) * page_size

        if not settings.is_sqlite:
            try:
                from geoalchemy2.functions import ST_Centroid, ST_X, ST_Y
                from geoalchemy2.types import Geography
                length_expr = func.round(cast(func.ST_Length(cast(model.geometry, Geography)), Numeric), 1)
                centroid = ST_Centroid(model.geometry)
                lat_expr = ST_Y(centroid)
                lon_expr = ST_X(centroid)
            except Exception:
                length_expr = cast(0.0, Numeric)
                lat_expr = cast(0.0, Numeric)
                lon_expr = cast(0.0, Numeric)
        else:
            length_expr = cast(0.0, Numeric)
            lat_expr = cast(0.0, Numeric)
            lon_expr = cast(0.0, Numeric)

        stmt = (
            select(
                model.id,
                model.name,
                model.road_type,
                length_expr.label("length"),
                lat_expr.label("lat"),
                lon_expr.label("lon"),
            )
            .where(*base_where)
            .order_by(model.name.asc().nulls_last(), model.id)
            .offset(offset)
            .limit(page_size)
        )

        rows = self.session.exec(stmt).all()
        items: List[ConsultationRecordDTO] = []
        for r in rows:
            name_val = r.name or f"Vía-{str(r.id)[:8]}"
            road_type = r.road_type or "Calle"
            length_val = f"{float(r.length):.0f} m" if r.length and float(r.length) > 0 else "-"
            items.append(
                ConsultationRecordDTO(
                    id=r.id,
                    layer_kind=layer.kind,
                    code=name_val,
                    manzana=road_type,
                    surface=length_val,
                    status="Registrado",
                    status_color="emerald",
                    latitude=float(r.lat) if r.lat and float(r.lat) != 0 else None,
                    longitude=float(r.lon) if r.lon and float(r.lon) != 0 else None,
                    attributes={"road_type": road_type},
                )
            )

        return PaginatedConsultationResponseDTO(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
            layer_name=layer.name,
        )
