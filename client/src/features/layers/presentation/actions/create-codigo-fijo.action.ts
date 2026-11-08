"use server";

import { revalidatePath } from "next/cache";
import type { ApiResult } from "@/features/shared/domain/types/api-results";
import type { CodigoFijo } from "../../domain/entities/codigo-fijo.entity";
import { codigoFijoRepositoryImpl } from "../../infrastructure/repositories/codigo-fijo.repository-impl";
import { createCodigoFijoSchema } from "../../infrastructure/schemas/codigo-fijo.schemas";

export async function createCodigoFijoAction(
  data: unknown
): Promise<ApiResult<CodigoFijo>> {
  const parsed = createCodigoFijoSchema.safeParse(data);
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

  const result = await codigoFijoRepositoryImpl.create(parsed.data);
  if (result.ok) {
    revalidatePath("/mapa");
  }

  return result;
}
