from sqlalchemy import case, func
from sqlmodel import Session, select

from app.modules.layers.application.ports.readers.codigo_fijo_statistics_reader import (
    CodigoFijoStatisticsReader,
)
from app.modules.layers.application.queries.get_codigo_fijo_statistics import (
    CodigoFijoStatisticsDTO,
)
from app.modules.layers.domain.enums import CodigoFijoStatus, LayerKind
from app.modules.layers.infrastructure.persistence.models.codigo_fijo_model import (
    CodigoFijoModel,
)
from app.modules.layers.infrastructure.persistence.models.data_version_model import (
    DataVersionModel,
)
from app.modules.layers.infrastructure.persistence.models.layer_model import LayerModel


class SqlModelCodigoFijoStatisticsReader(CodigoFijoStatisticsReader):
    """
    Implementación SQLModel del puerto CodigoFijoStatisticsReader.
    Realiza una única consulta de agregación condicional a nivel de base de datos
    para obtener los conteos exactos de códigos fijos por estado en O(1) viajes a BD.
    """

    def __init__(self, session: Session) -> None:
        self.session = session

    def get_statistics(self) -> CodigoFijoStatisticsDTO:
        # 1. Obtener el ID de la versión de datos activa de la capa de Códigos Fijos
        version_statement = (
            select(DataVersionModel.id)
            .join(LayerModel, LayerModel.id == DataVersionModel.layer_id)
            .where(
                LayerModel.kind == LayerKind.CODIGOS_FIJOS,
                LayerModel.deleted_date.is_(None),
                DataVersionModel.is_active == True,
                DataVersionModel.deleted_date.is_(None),
            )
        )
        active_version_id = self.session.exec(version_statement).first()

        # Si no existe la capa o no tiene una versión de datos activa, retornar ceros
        if not active_version_id:
            return CodigoFijoStatisticsDTO(
                total=0,
                normal=0,
                para_corte=0,
                cortado=0,
                baja_parcial=0,
                baja_total=0,
            )

        # 2. Agregación condicional en un solo paso
        aggregation_statement = (
            select(
                func.count(CodigoFijoModel.id).label("total"),
                func.count(
                    case((CodigoFijoModel.status == CodigoFijoStatus.NORMAL.value, 1))
                ).label("normal"),
                func.count(
                    case((CodigoFijoModel.status == CodigoFijoStatus.PARA_CORTE.value, 1))
                ).label("para_corte"),
                func.count(
                    case((CodigoFijoModel.status == CodigoFijoStatus.CORTADO.value, 1))
                ).label("cortado"),
                func.count(
                    case((CodigoFijoModel.status == CodigoFijoStatus.BAJA_PARCIAL.value, 1))
                ).label("baja_parcial"),
                func.count(
                    case((CodigoFijoModel.status == CodigoFijoStatus.BAJA_TOTAL.value, 1))
                ).label("baja_total"),
            )
            .where(CodigoFijoModel.data_version_id == active_version_id)
            .where(CodigoFijoModel.deleted_date.is_(None))
        )

        row = self.session.exec(aggregation_statement).first()

        if not row:
            return CodigoFijoStatisticsDTO(
                total=0,
                normal=0,
                para_corte=0,
                cortado=0,
                baja_parcial=0,
                baja_total=0,
            )

        total, normal, para_corte, cortado, baja_parcial, baja_total = row
        return CodigoFijoStatisticsDTO(
            total=int(total or 0),
            normal=int(normal or 0),
            para_corte=int(para_corte or 0),
            cortado=int(cortado or 0),
            baja_parcial=int(baja_parcial or 0),
            baja_total=int(baja_total or 0),
        )
