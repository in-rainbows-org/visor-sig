from dataclasses import dataclass

from app.modules.layers.application.ports.readers.codigo_fijo_statistics_reader import (
    CodigoFijoStatisticsReader,
)


@dataclass(frozen=True, slots=True)
class GetCodigoFijoStatisticsQuery:
    """Parámetros para la consulta de estadísticas agregadas de códigos fijos."""


@dataclass(frozen=True, slots=True)
class CodigoFijoStatisticsDTO:
    """
    DTO inmutable de aplicación que encapsula el conteo total y por cada estado operativo.
    """

    total: int
    normal: int
    para_corte: int
    cortado: int
    baja_parcial: int
    baja_total: int


class GetCodigoFijoStatisticsQueryHandler:
    """
    Manejador de la consulta CQRS para obtener el resumen estadístico de códigos fijos.
    """

    def __init__(self, reader: CodigoFijoStatisticsReader) -> None:
        self.reader = reader

    def execute(
        self, query: GetCodigoFijoStatisticsQuery | None = None
    ) -> CodigoFijoStatisticsDTO:
        return self.reader.get_statistics()
