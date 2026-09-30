import type {
  ApiMaybeResult,
  ApiResult,
} from "@/features/shared/domain/types/api-results";
import type {
  ChangeLayerColorInput,
  Layer,
} from "../entities/layer.entity";

export type LayerRepository = {
  list(): Promise<ApiResult<Layer[]>>;
  getById(layerId: string): Promise<ApiMaybeResult<Layer>>;
  changeColor(
    layerId: string,
    input: ChangeLayerColorInput
  ): Promise<ApiResult<Layer>>;
};
