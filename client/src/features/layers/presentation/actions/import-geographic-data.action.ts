"use server";

import { revalidatePath } from "next/cache";
import type { ApiResult } from "@/features/shared/domain/types/api-results";
import type { DataVersion } from "../../domain/entities/data-version.entity";
import { httpDataVersionRepository } from "../../infrastructure/repositories/http-data-version.repository";

export async function importGeographicDataAction(
  formData: FormData
): Promise<ApiResult<DataVersion>> {
  const layerId = formData.get("layerId") as string | null;
  const file = formData.get("file") as File | null;

  if (!layerId) {
    return {
      ok: false,
      statusCode: 422,
      errors: ["Identificador de capa no proporcionado."],
    };
  }

  if (!file || !(file instanceof File) || file.size === 0) {
    return {
      ok: false,
      statusCode: 422,
      errors: ["Debe seleccionar un archivo para importar."],
    };
  }

  // Validación de extensión .zip
  if (!file.name.toLowerCase().endsWith(".zip")) {
    return {
      ok: false,
      statusCode: 415,
      errors: [
        "Formato de archivo no compatible. Debe proporcionar un archivo comprimido .zip.",
      ],
    };
  }

  // Validación de tamaño máximo (100 MB = 104,857,600 bytes)
  const MAX_SIZE = 104857600;
  if (file.size > MAX_SIZE) {
    return {
      ok: false,
      statusCode: 413,
      errors: [
        "El archivo seleccionado excede el tamaño máximo permitido de 100 MB.",
      ],
    };
  }

  const result = await httpDataVersionRepository.importZip({
    layerId,
    file,
  });

  if (result.ok) {
    revalidatePath("/capas");
  }

  return result;
}
