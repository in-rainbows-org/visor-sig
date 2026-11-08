import type { ApiResult } from "@/features/shared/domain/types/api-results";
import type {
  CodigoFijo,
  CreateCodigoFijoInput,
} from "../entities/codigo-fijo.entity";

export type CodigoFijoRepository = {
  create(input: CreateCodigoFijoInput): Promise<ApiResult<CodigoFijo>>;
};
