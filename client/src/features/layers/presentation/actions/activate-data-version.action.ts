"use server";

import { revalidatePath } from "next/cache";
import type { ApiResult } from "@/features/shared/domain/types/api-results";
import type { DataVersion } from "../../domain/entities/data-version.entity";
import { httpDataVersionRepository } from "../../infrastructure/repositories/http-data-version.repository";
import { activateDataVersionCommandSchema } from "../../infrastructure/schemas/data-version.schemas";

export async function activateDataVersionAction(
  data: unknown
): Promise<ApiResult<DataVersion>> {
  const parsed = activateDataVersionCommandSchema.safeParse(data);
  if (!parsed.success) {
    return {
      ok: false,
      statusCode: 422,
      errors: parsed.error.issues.map((i) => i.message),
    };
  }

  const result = await httpDataVersionRepository.activateVersion(parsed.data);
  if (result.ok) {
    revalidatePath("/capas");
  }

  return result;
}
