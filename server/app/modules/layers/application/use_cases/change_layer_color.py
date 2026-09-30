import uuid
from dataclasses import dataclass

from app.modules.layers.domain.enums import LayerColor
from app.modules.layers.domain.exceptions import LayerNotFoundException
from app.modules.layers.domain.repositories.layer_repository import LayerRepository
from app.shared.infrastructure.unit_of_work import SqlModelUnitOfWork


@dataclass(frozen=True)
class ChangeLayerColorCommand:
    layer_id: uuid.UUID
    color: LayerColor


class ChangeLayerColorUseCase:
    """Caso de uso exclusivo para cambiar el color de una capa predefinida."""

    def __init__(self, layer_repo: LayerRepository, uow: SqlModelUnitOfWork) -> None:
        self.layer_repo = layer_repo
        self.uow = uow

    def execute(self, command: ChangeLayerColorCommand) -> None:
        layer = self.layer_repo.find_by_id(command.layer_id)
        if not layer:
            raise LayerNotFoundException(command.layer_id)

        layer.change_color(command.color)
        self.layer_repo.save(layer)
        self.uow.commit()
