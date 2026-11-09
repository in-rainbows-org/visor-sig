import uuid
from datetime import datetime, timezone

from app.modules.layers.domain.entities.codigo_fijo import CodigoFijo
from app.modules.layers.domain.enums import CodigoFijoStatus
from app.modules.layers.domain.repositories.codigo_fijo_repository import (
    CodigoFijoRepository,
)
from app.modules.layers.infrastructure.persistence.models.codigo_fijo_model import (
    CodigoFijoModel,
)
from geoalchemy2.elements import WKTElement
from sqlalchemy import func
from sqlmodel import Session, select


class SqlModelCodigoFijoRepository(CodigoFijoRepository):
    """Repositorio SQLModel para persistencia de la tabla specialized 'codigos_fijos'."""

    def __init__(self, session: Session) -> None:
        self.session = session

    def get_by_id(self, id: uuid.UUID) -> CodigoFijo | None:
        statement = (
            select(CodigoFijoModel)
            .where(CodigoFijoModel.id == id)
            .where(CodigoFijoModel.deleted_date.is_(None))
        )
        record = self.session.exec(statement).first()
        if record is None:
            return None
        return self._to_domain(record)

    def find_by_fixed_code(self, fixed_code: int) -> CodigoFijo | None:
        statement = (
            select(CodigoFijoModel)
            .where(CodigoFijoModel.fixed_code == fixed_code)
            .where(CodigoFijoModel.deleted_date.is_(None))
        )
        record = self.session.exec(statement).first()
        if record is None:
            return None
        return self._to_domain(record)

    def save(self, codigo_fijo: CodigoFijo) -> None:
        model = self.session.get(CodigoFijoModel, codigo_fijo.id)
        now = datetime.now(timezone.utc)
        if model is None:
            model = CodigoFijoModel(
                id=codigo_fijo.id,
                data_version_id=codigo_fijo.data_version_id,
                source_feature_id=codigo_fijo.source_feature_id,
                label=codigo_fijo.label,
                sql_code=codigo_fijo.sql_code,
                sig_code=codigo_fijo.sig_code,
                fixed_code=codigo_fijo.fixed_code,
                name=codigo_fijo.name,
                longitude=codigo_fijo.longitude,
                latitude=codigo_fijo.latitude,
                status=codigo_fijo.status.value,
                status_changed_at=codigo_fijo.status_changed_at or now,
                geometry=WKTElement(codigo_fijo.geometry_wkt, srid=4326),
                properties=codigo_fijo.properties or {},
                lote_id=codigo_fijo.lote_id,
                created_date=now,
                modified_date=now,
            )
            self.session.add(model)
        else:
            model.data_version_id = codigo_fijo.data_version_id
            model.fixed_code = codigo_fijo.fixed_code
            model.name = codigo_fijo.name
            model.longitude = codigo_fijo.longitude
            model.latitude = codigo_fijo.latitude
            model.status = codigo_fijo.status.value
            model.status_changed_at = codigo_fijo.status_changed_at or now
            model.geometry = WKTElement(codigo_fijo.geometry_wkt, srid=4326)
            model.properties = codigo_fijo.properties or {}
            model.lote_id = codigo_fijo.lote_id
            model.modified_date = now
            self.session.add(model)
        self.session.flush()

    def _to_domain(self, model: CodigoFijoModel) -> CodigoFijo:
        return CodigoFijo(
            id=model.id,
            longitude=model.longitude,
            latitude=model.latitude,
            status=CodigoFijoStatus(model.status),
            status_changed_at=model.status_changed_at,
            geometry_wkt=f"MULTIPOINT(({model.longitude} {model.latitude}))",
            data_version_id=model.data_version_id,
            source_feature_id=model.source_feature_id,
            label=model.label,
            sql_code=model.sql_code,
            sig_code=model.sig_code,
            fixed_code=model.fixed_code,
            name=model.name,
            lote_id=model.lote_id,
            properties=model.properties or {},
        )

    def bulk_insert(self, items: list[CodigoFijoModel], batch_size: int = 1000) -> None:
        if not items:
            return
        for i in range(0, len(items), batch_size):
            chunk = items[i : i + batch_size]
            self.session.add_all(chunk)
            self.session.flush()

    def count_by_version(self, data_version_id: uuid.UUID) -> int:
        statement = (
            select(func.count(CodigoFijoModel.id))
            .where(CodigoFijoModel.data_version_id == data_version_id)
            .where(CodigoFijoModel.deleted_date.is_(None))
        )
        return self.session.exec(statement).one() or 0

    def delete_by_version(self, data_version_id: uuid.UUID) -> None:
        statement = select(CodigoFijoModel).where(CodigoFijoModel.data_version_id == data_version_id)
        records = self.session.exec(statement).all()
        for record in records:
            self.session.delete(record)
        self.session.flush()
