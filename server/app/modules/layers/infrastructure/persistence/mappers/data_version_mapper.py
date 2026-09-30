from typing import Optional

from app.modules.layers.application.queries.data_version_dtos import DataVersionDTO
from app.modules.layers.domain.entities.data_version import DataVersion
from app.modules.layers.domain.enums import DataVersionStatus
from app.modules.layers.infrastructure.persistence.models.data_version_model import DataVersionModel


class DataVersionMapper:
    """Mapeador entre DataVersion (dominio), DataVersionModel (persistencia) y DataVersionDTO."""

    @staticmethod
    def to_domain(model: DataVersionModel) -> DataVersion:
        return DataVersion(
            id=model.id,
            layer_id=model.layer_id,
            version_number=model.version_number,
            status=DataVersionStatus(model.status),
            source_filename=model.source_filename,
            feature_count=model.feature_count,
            error_message=model.error_message,
        )

    @staticmethod
    def to_model(
        entity: DataVersion,
        existing_model: Optional[DataVersionModel] = None,
        imported_by_user_id: Optional[str] = None,
    ) -> DataVersionModel:
        model = existing_model or DataVersionModel(id=entity.id, layer_id=entity.layer_id)
        model.version_number = entity.version_number
        model.status = entity.status.value if hasattr(entity.status, "value") else str(entity.status)
        model.source_filename = entity.source_filename
        model.feature_count = entity.feature_count
        model.error_message = entity.error_message
        if imported_by_user_id:
            model.imported_by_user_id = imported_by_user_id
        return model

    @staticmethod
    def to_dto(model: DataVersionModel, is_active: bool = False) -> DataVersionDTO:
        return DataVersionDTO(
            id=model.id,
            layer_id=model.layer_id,
            version_number=model.version_number,
            status=model.status,
            source_filename=model.source_filename,
            feature_count=model.feature_count,
            error_message=model.error_message,
            is_active=is_active,
            created_at=model.created_date,
        )
