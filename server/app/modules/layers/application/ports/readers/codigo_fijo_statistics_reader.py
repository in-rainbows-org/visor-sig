from __future__ import annotations

from abc import ABC, abstractmethod
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.modules.layers.application.queries.get_codigo_fijo_statistics import (
        CodigoFijoStatisticsDTO,
    )


class CodigoFijoStatisticsReader(ABC):
    """
    Puerto secundario de lectura para estadísticas cuantitativas agregadas de códigos fijos.
    Permite obtener métricas sumarias de la versión activa sin cargar registros individuales en memoria.
    """

    @abstractmethod
    def get_statistics(self) -> CodigoFijoStatisticsDTO:
        """Calcula y retorna el resumen estadístico de la versión de datos activa de códigos fijos."""
        pass
