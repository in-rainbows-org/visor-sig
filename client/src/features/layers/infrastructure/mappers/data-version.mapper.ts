import type { DataVersion } from "../../domain/entities/data-version.entity";
import type { DataVersionReadDto } from "../schemas/data-version.schemas";

export const dataVersionMapper = {
  toDomain(dto: DataVersionReadDto): DataVersion {
    return {
      id: dto.id,
      layerId: dto.layer_id,
      versionNumber: dto.version_number,
      status: dto.status,
      sourceFilename: dto.source_filename,
      featureCount: dto.feature_count,
      errorMessage: dto.error_message ?? null,
      isActive: dto.is_active,
      createdAt: dto.created_at,
    };
  },

  toDomainList(dtos: DataVersionReadDto[]): DataVersion[] {
    return dtos.map(dataVersionMapper.toDomain);
  },
};
