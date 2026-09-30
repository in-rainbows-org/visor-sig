from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any, Optional


@dataclass(frozen=True)
class ParsedFeature:
    """Representa una entidad extraída y normalizada del Shapefile."""

    geometry_wkb: bytes
    properties: dict[str, Any]
    source_feature_id: Optional[str] = None


@dataclass(frozen=True)
class ShapefileProcessResult:
    """Resultado del procesamiento y validación de un paquete ZIP Shapefile."""

    features: list[ParsedFeature]
    source_dataset_name: str

    @property
    def feature_count(self) -> int:
        return len(self.features)


class ShapefileProcessor(ABC):
    """Puerto para el procesamiento y validación de archivos ZIP Shapefile en infraestructura."""

    @abstractmethod
    def process_zip(
        self,
        zip_bytes: bytes,
        target_geometry_type: str,
    ) -> ShapefileProcessResult:
        """
        Extrae de forma segura en memoria/temporal el archivo ZIP, valida presencia de
        .shp, .shx, .dbf, .prj con mismo nombre base, verifica CRS EPSG:4326,
        normaliza geometrías a 2D y valida correspondencia con target_geometry_type.
        """
        pass
