import uuid
from dataclasses import dataclass
from datetime import datetime, timezone

from app.modules.layers.domain.entities.codigo_fijo import CodigoFijo
from app.modules.layers.domain.enums import CodigoFijoStatus, LayerKind
from app.modules.layers.domain.exceptions import CodigoFijoAlreadyExistsException
from app.modules.layers.domain.repositories.codigo_fijo_repository import (
    CodigoFijoRepository,
)
from app.modules.layers.domain.repositories.layer_repository import LayerRepository
from app.shared.application.ports import UnitOfWork


@dataclass(frozen=True, slots=True)
class CreateCodigoFijoCommand:
    fixed_code: int
    name: str
    latitude: float
    longitude: float
    status: int = 1
    user_id: str | None = None


class CreateCodigoFijoUseCase:
    """
    Caso de uso para registrar un código fijo desde el mapa.
    - Valida unicidad de fixed_code (FR-004).
    - Asocia el registro a la versión activa de la capa de Códigos Fijos (si existe).
    - Genera la geometría MULTIPOINT con SRID 4326.
    - Persiste y confirma la transacción mediante UnitOfWork.
    """

    def __init__(
        self,
        codigo_fijo_repository: CodigoFijoRepository,
        layer_repository: LayerRepository,
        uow: UnitOfWork,
    ) -> None:
        self.codigo_fijo_repository = codigo_fijo_repository
        self.layer_repository = layer_repository
        self.uow = uow

    def execute(self, command: CreateCodigoFijoCommand) -> CodigoFijo:
        existing = self.codigo_fijo_repository.find_by_fixed_code(command.fixed_code)
        if existing is not None:
            raise CodigoFijoAlreadyExistsException(command.fixed_code)

        layer = self.layer_repository.find_by_kind(LayerKind.CODIGOS_FIJOS)
        active_version_id = layer.active_data_version_id if layer else None

        now = datetime.now(timezone.utc)
        geometry_wkt = f"MULTIPOINT(({command.longitude} {command.latitude}))"

        try:
            status_enum = CodigoFijoStatus(command.status)
        except ValueError:
            status_enum = CodigoFijoStatus.NORMAL

        codigo_fijo = CodigoFijo(
            id=uuid.uuid4(),
            data_version_id=active_version_id,
            source_feature_id=None,
            label=None,
            sql_code=None,
            sig_code=None,
            fixed_code=command.fixed_code,
            name=command.name.strip(),
            longitude=command.longitude,
            latitude=command.latitude,
            status=status_enum,
            status_changed_at=now,
            geometry_wkt=geometry_wkt,
            lote_id=None,
            properties={},
        )

        self.codigo_fijo_repository.save(codigo_fijo)
        self.uow.commit()

        return codigo_fijo
