import uuid
from sqlalchemy import text
from sqlmodel import Session

from app.modules.layers.application.ports.providers.cadastral_linker import (
    CadastralLinker,
)


class CadastralSpatialLinker(CadastralLinker):
    """
    Servicio de geoprocesamiento PostGIS para vincular topológicamente
    las entidades catastrales:
    - Lotes -> Manzanas (manzana_id)
    - Códigos Fijos -> Lotes (lote_id)
    """

    def __init__(self, session: Session) -> None:
        self.session = session

    def link_lotes_to_manzanas(self, lotes_version_id: uuid.UUID | None = None) -> int:
        """
        Asocia cada lote a su manzana contenedora usando ST_PointOnSurface(lote.geometry) && ST_Intersects.
        Si lotes_version_id no se provee, toma la versión activa de LOTES.
        """
        where_version = "lotes.data_version_id = :lotes_ver_id" if lotes_version_id else """
            lotes.data_version_id IN (
                SELECT dv.id FROM data_versions dv
                JOIN layers ly ON ly.id = dv.layer_id
                WHERE ly.kind = 'LOTES' AND dv.is_active = true AND dv.deleted_date IS NULL
            )
        """
        sql = f"""
            UPDATE lotes
               SET manzana_id = m.id
              FROM manzanas m
              JOIN data_versions dvm ON dvm.id = m.data_version_id AND dvm.is_active = true AND dvm.deleted_date IS NULL
              JOIN layers lm ON lm.id = dvm.layer_id AND lm.kind = 'MANZANAS'
             WHERE {where_version}
               AND ST_Intersects(ST_PointOnSurface(lotes.geometry), m.geometry);
        """
        params = {"lotes_ver_id": lotes_version_id} if lotes_version_id else {}
        result = self.session.execute(text(sql), params)
        self.session.flush()
        return int(result.rowcount or 0)

    def link_codigos_fijos_to_lotes(self, codigos_fijos_version_id: uuid.UUID | None = None) -> int:
        """
        Asocia cada código fijo a su lote contenedor usando ST_Intersects(codigo_fijo.geometry, lote.geometry).
        Si codigos_fijos_version_id no se provee, toma la versión activa de CODIGOS_FIJOS.
        """
        where_version = "codigos_fijos.data_version_id = :cf_ver_id" if codigos_fijos_version_id else """
            codigos_fijos.data_version_id IN (
                SELECT dv.id FROM data_versions dv
                JOIN layers ly ON ly.id = dv.layer_id
                WHERE ly.kind = 'CODIGOS_FIJOS' AND dv.is_active = true AND dv.deleted_date IS NULL
            )
        """
        sql = f"""
            UPDATE codigos_fijos
               SET lote_id = l.id
              FROM lotes l
              JOIN data_versions dvl ON dvl.id = l.data_version_id AND dvl.is_active = true AND dvl.deleted_date IS NULL
              JOIN layers ll ON ll.id = dvl.layer_id AND ll.kind = 'LOTES'
             WHERE {where_version}
               AND ST_Intersects(codigos_fijos.geometry, l.geometry);
        """
        params = {"cf_ver_id": codigos_fijos_version_id} if codigos_fijos_version_id else {}
        result = self.session.execute(text(sql), params)
        self.session.flush()
        return int(result.rowcount or 0)

    def link_all_active(self) -> dict[str, int]:
        """Ejecuta la vinculación completa de las versiones activas actuales."""
        lotes_count = self.link_lotes_to_manzanas()
        cf_count = self.link_codigos_fijos_to_lotes()
        return {
            "lotes_linked": lotes_count,
            "codigos_fijos_linked": cf_count,
        }
