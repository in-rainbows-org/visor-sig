"use server";

import { revalidatePath } from "next/cache";
import type { ApiResult } from "@/features/shared/domain/types/api-results";
import type { Layer } from "../../domain/entities/layer.entity";
import { httpLayerRepository } from "../../infrastructure/repositories/http-layer.repository";
import { changeLayerColorCommandSchema } from "../../infrastructure/schemas/layer.schemas";

export async function changeLayerColorAction(
  layerId: string,
  data: unknown
): Promise<ApiResult<Layer>> {
  const parsed = changeLayerColorCommandSchema.safeParse(data);
  if (!parsed.success) {
    const errorMap: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path.join(".") || "general";
      if (!errorMap[field]) {
        errorMap[field] = [];
      }
      errorMap[field].push(issue.message);
    }

    return {
      ok: false,
      statusCode: 422,
      errors: parsed.error.issues.map((issue) => issue.message),
      validationErrors: errorMap,
    };
  }

  const result = await httpLayerRepository.changeColor(layerId, parsed.data);
  if (result.ok) {
    revalidatePath("/capas");
  }

  return result;
}
