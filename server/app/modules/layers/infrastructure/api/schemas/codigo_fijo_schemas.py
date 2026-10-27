from pydantic import BaseModel, ConfigDict, Field


class CodigoFijoStatisticsRead(BaseModel):
    """
    Esquema de salida de la API para el resumen estadístico de códigos fijos activos.
    """

    model_config = ConfigDict(from_attributes=True)

    total: int = Field(
        ...,
        ge=0,
        description="Total general de códigos fijos registrados en la versión activa",
        examples=[12500],
    )
    normal: int = Field(
        ...,
        ge=0,
        description="Cantidad de suministros con estado Normal (1)",
        examples=[9800],
    )
    para_corte: int = Field(
        ...,
        ge=0,
        description="Cantidad de suministros con estado Para corte (2)",
        examples=[1200],
    )
    cortado: int = Field(
        ...,
        ge=0,
        description="Cantidad de suministros con estado Cortado (3)",
        examples=[800],
    )
    baja_parcial: int = Field(
        ...,
        ge=0,
        description="Cantidad de suministros con estado Baja parcial (4)",
        examples=[450],
    )
    baja_total: int = Field(
        ...,
        ge=0,
        description="Cantidad de suministros con estado Baja total (5)",
        examples=[250],
    )
