import uuid
from app.shared.infrastructure.db.base_model import BaseModel


class SampleModel(BaseModel, table=False):
    name: str = "Test"


def test_base_model_has_no_state_attribute():
    model = SampleModel()
    assert not hasattr(model, "state"), "BaseModel no debe tener el atributo legacy 'state'"
    assert "state" not in SampleModel.model_fields, "'state' no debe existir en los model_fields de BaseModel"


def test_base_model_soft_delete_and_restore_uses_deleted_date():
    model = SampleModel()
    assert model.deleted_date is None
    assert not model.is_deleted

    # Soft delete
    model.soft_delete()
    assert model.deleted_date is not None
    assert model.is_deleted

    # Restore
    model.restore()
    assert model.deleted_date is None
    assert not model.is_deleted
