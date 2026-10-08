from typing import Generic, TypeVar
import uuid
from pydantic import BaseModel, ConfigDict, Field

T = TypeVar("T")


class ManzanaConsultationItemSchema(BaseModel):
    """Representación pública de un elemento en el listado de consulta de manzanas."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID = Field(description="Identificador único de la manzana")
    uv_block_code: str | None = Field(default=None, description="Código compuesto UV-Manzana (ej. UV01-MZ02)")
    uv: str | None = Field(default=None, description="Unidad Vecinal")
    block_number: str | None = Field(default=None, description="Número de manzana")


class ViaConsultationItemSchema(BaseModel):
    """Representación pública de un elemento en el listado de consulta de vías."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID = Field(description="Identificador único del tramo de vía")
    name: str | None = Field(default=None, description="Nombre o denominación de la vía")
    reference: str | None = Field(default=None, description="Referencia catastral o código de tramo")
    road_type: str | None = Field(default=None, description="Tipo de vía (Avenida, Calle, Pasaje, etc.)")


class LoteConsultationItemSchema(BaseModel):
    """Representación pública de un elemento en el listado de consulta de lotes."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID = Field(description="Identificador único del lote")
    lot_number: str | None = Field(default=None, description="Número o código del lote")
    manzana_uv_block_code: str | None = Field(
        default=None,
        description="Código compuesto UV-Manzana de la manzana asociada al lote",
    )


class CodigoFijoConsultationItemSchema(BaseModel):
    """Representación pública de un elemento en el listado de consulta de códigos fijos."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID = Field(description="Identificador único de la conexión de código fijo")
    label: str | None = Field(default=None, description="Etiqueta o referencia catastral del punto")
    fixed_code: int | None = Field(default=None, description="Código fijo numérico de la conexión")
    name: str | None = Field(default=None, description="Nombre o titular del abonado")
    status: int = Field(description="Código numérico del estado del servicio (1 a 5)")
    lot_number: str | None = Field(
        default=None,
        description="Número del lote catastral asociado al código fijo",
    )


class CodigoFijoDetailSchema(BaseModel):
    """Representación pública del detalle georreferenciado completo de un código fijo."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID = Field(description="Identificador único del código fijo")
    label: str | None = Field(default=None, description="Etiqueta catastral o identificador alfanumérico")
    fixed_code: int | None = Field(default=None, description="Número entero de código fijo")
    name: str | None = Field(default=None, description="Nombre o titular del abonado")
    status: int = Field(description="Estado del servicio (1 a 5)")
    latitude: float = Field(description="Latitud en coordenadas WGS84 EPSG:4326")
    longitude: float = Field(description="Longitud en coordenadas WGS84 EPSG:4326")
    lot_number: str | None = Field(default=None, description="Número de lote catastral asociado")
    uv: str | None = Field(default=None, description="Unidad Vecinal")
    block_number: str | None = Field(default=None, description="Número de manzana catastral")
    uv_block_code: str | None = Field(default=None, description="Código compuesto UV-Manzana")



class PaginatedConsultationResponseSchema(BaseModel, Generic[T]):
    """Esquema genérico estándar de respuesta paginada para consultas alfanuméricas."""

    items: list[T] = Field(description="Lista de elementos correspondientes a la página consultada")
    total: int = Field(description="Cantidad total de registros coincidentes")
    page: int = Field(description="Número de página actual")
    page_size: int = Field(description="Cantidad de registros por página")
    total_pages: int = Field(description="Cantidad total de páginas disponibles")
