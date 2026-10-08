import type { ApiResult } from "@/features/shared/domain/types/api-results";
import type {
  ChangeLayerColorInput,
  Layer,
} from "../entities/layer.entity";

export type LayerRepository = {
  list(): Promise<ApiResult<Layer[]>>;
  changeColor(
    layerId: string,
    input: ChangeLayerColorInput
  ): Promise<ApiResult<Layer>>;
};
