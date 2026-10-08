import uuid
from dataclasses import dataclass

from app.modules.layers.domain.entities.layer import Layer
from app.modules.layers.domain.enums import LayerColor
from app.modules.layers.domain.exceptions import LayerNotFoundException
from app.modules.layers.domain.repositories.layer_repository import LayerRepository
from app.shared.application.ports import UnitOfWork


@dataclass(frozen=True, slots=True)
class ChangeLayerColorCommand:
    layer_id: uuid.UUID
    color: LayerColor
    user_id: str | None = None


class ChangeLayerColorUseCase:
    """Caso de uso exclusivo para cambiar el color de una capa predefinida."""

    def __init__(self, layer_repo: LayerRepository, uow: UnitOfWork) -> None:
        self.layer_repo = layer_repo
        self.uow = uow

    def execute(self, command: ChangeLayerColorCommand) -> Layer:
        layer = self.layer_repo.find_by_id(command.layer_id)
        if not layer:
            raise LayerNotFoundException(command.layer_id)

        layer.change_color(command.color)
        self.layer_repo.save(layer)

        if hasattr(self.uow, "publish") and command.user_id:
            from app.modules.layers.domain.events import LayerColorChangedEvent

            self.uow.publish(
                LayerColorChangedEvent(
                    user_id=command.user_id,
                    layer_name=layer.name,
                    new_color=command.color.value if hasattr(command.color, "value") else str(command.color),
                )
            )

        self.uow.commit()
        return layer
