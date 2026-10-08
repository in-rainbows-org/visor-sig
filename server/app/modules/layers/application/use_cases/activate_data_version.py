import uuid
from dataclasses import dataclass

from app.modules.layers.domain.entities.data_version import DataVersion
from app.modules.layers.domain.enums import DataVersionStatus
from app.modules.layers.domain.exceptions import (
    DataVersionNotFoundException,
    InvalidDataVersionAssignmentException,
    LayerNotFoundException,
)
from app.modules.layers.domain.repositories.data_version_repository import (
    DataVersionRepository,
)
from app.modules.layers.domain.repositories.layer_repository import LayerRepository
from app.shared.application.ports import UnitOfWork


@dataclass(frozen=True, slots=True)
class ActivateDataVersionCommand:
    layer_id: uuid.UUID
    version_id: uuid.UUID
    user_id: str | None = None


class ActivateDataVersionUseCase:
    """
    Caso de uso para reactivar o hacer rollback hacia una versión histórica específica.
    Garantiza:
    - Que la capa exista y esté habilitada.
    - Que la versión exista y pertenezca a la misma capa.
    - Que la versión esté en estado READY.
    - Que la conmutación de active_data_version_id sea atómica sin alterar datos geográficos.
    """

    def __init__(
        self,
        layer_repository: LayerRepository,
        version_repository: DataVersionRepository,
        uow: UnitOfWork,
    ) -> None:
        self.layer_repository = layer_repository
        self.version_repository = version_repository
        self.uow = uow

    def execute(self, command: ActivateDataVersionCommand) -> DataVersion:
        layer = self.layer_repository.find_by_id(command.layer_id)
        if layer is None:
            raise LayerNotFoundException(command.layer_id)

        version = self.version_repository.find_by_id(command.version_id)
        if version is None:
            raise DataVersionNotFoundException(command.version_id)

        if version.layer_id != layer.id:
            raise InvalidDataVersionAssignmentException(
                "Solo se puede asignar como activa una versión de datos perteneciente a la misma capa."
            )

        if version.status != DataVersionStatus.READY:
            raise InvalidDataVersionAssignmentException(
                f"Solo se puede asignar como activa una versión en estado READY (estado actual: '{version.status.value}')."
            )

        self.version_repository.set_active_version(layer.id, version.id)
        version.activate()

        if hasattr(self.uow, "publish") and command.user_id:
            from app.modules.layers.domain.events import DataVersionActivatedEvent

            self.uow.publish(
                DataVersionActivatedEvent(
                    user_id=command.user_id,
                    layer_name=layer.name,
                    version_number=version.version_number,
                )
            )

        self.uow.commit()

        return version
