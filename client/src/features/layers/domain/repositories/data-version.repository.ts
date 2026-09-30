import type {
  ApiMaybeResult,
  ApiResult,
} from "@/features/shared/domain/types/api-results";
import type {
  ActivateDataVersionInput,
  DataVersion,
  ImportGeographicDataInput,
} from "../entities/data-version.entity";

export type DataVersionRepository = {
  listByLayer(layerId: string): Promise<ApiResult<DataVersion[]>>;
  getById(
    layerId: string,
    versionId: string
  ): Promise<ApiMaybeResult<DataVersion>>;
  importZip(input: ImportGeographicDataInput): Promise<ApiResult<DataVersion>>;
  activateVersion(
    input: ActivateDataVersionInput
  ): Promise<ApiResult<DataVersion>>;
};
