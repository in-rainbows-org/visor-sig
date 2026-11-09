import logging
from typing import Any

import cloudinary
import cloudinary.uploader
from app.core.config import settings
from app.shared.application.ports import ImageStorageService
from app.shared.domain.exceptions import DomainException, ValidationException

logger = logging.getLogger(__name__)


class CloudinaryImageStorageService(ImageStorageService):
    """Adaptador de infraestructura para almacenamiento de imágenes en Cloudinary."""

    def __init__(
        self,
        cloud_name: str | None = None,
        api_key: str | None = None,
        api_secret: str | None = None,
        default_folder: str | None = None,
    ) -> None:
        self.cloud_name = cloud_name or settings.CLOUDINARY_CLOUD_NAME
        self.api_key = api_key or settings.CLOUDINARY_API_KEY
        self.api_secret = api_secret or settings.CLOUDINARY_API_SECRET
        self.default_folder = default_folder or settings.CLOUDINARY_FOLDER or "sig"

        if self.cloud_name and self.api_key and self.api_secret:
            cloudinary.config(
                cloud_name=self.cloud_name,
                api_key=self.api_key,
                api_secret=self.api_secret,
                secure=True,
            )

    def upload_image(
        self,
        file_bytes: bytes,
        filename: str | None = None,
        folder: str = "sig",
    ) -> str:
        """Sube la imagen a Cloudinary en la carpeta designada y retorna la URL segura."""
        if not file_bytes:
            raise ValidationException("El archivo de imagen provisto está vacío.")

        if not (self.cloud_name and self.api_key and self.api_secret):
            raise DomainException(
                "Credenciales de Cloudinary incompletas o no cargadas en el servidor. "
                "Verifica que CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY y CLOUDINARY_API_SECRET "
                "estén definidas en application/server/.env y reinicia el servidor FastAPI."
            )

        target_folder = folder or self.default_folder or "sig"

        try:
            upload_params: dict[str, Any] = {
                "folder": target_folder,
                "resource_type": "image",
                "cloud_name": self.cloud_name,
                "api_key": self.api_key,
                "api_secret": self.api_secret,
            }
            if filename:
                upload_params["public_id"] = filename.rsplit(".", 1)[0]

            response = cloudinary.uploader.upload(file_bytes, **upload_params)
            secure_url = response.get("secure_url") or response.get("url")
            if not secure_url:
                raise DomainException("Cloudinary no devolvió una URL válida para la imagen subida.")
            return str(secure_url)
        except Exception as exc:
            logger.error("Error al subir imagen a Cloudinary (folder=%s): %s", target_folder, exc)
            if isinstance(exc, (DomainException, ValidationException)):
                raise
            raise DomainException(f"Error al subir imagen a Cloudinary: {exc}") from exc
