import type {
  ChangeLayerColorInput,
  Layer,
} from "../../domain/entities/layer.entity";
import type {
  ChangeLayerColorCommand,
  LayerReadDto,
} from "../schemas/layer.schemas";

export const layerMapper = {
  toDomain(dto: LayerReadDto): Layer {
    return {
      id: dto.id,
      kind: dto.kind,
      name: dto.name,
      geometryType: dto.geometry_type,
      color: dto.color,
      activeDataVersionId: dto.active_data_version_id,
      updatedAt: dto.updated_at,
    };
  },

  toDomainList(dtos: LayerReadDto[]): Layer[] {
    return dtos.map(layerMapper.toDomain);
  },

  toChangeColorPayload(
    input: ChangeLayerColorInput | ChangeLayerColorCommand
  ): {
    color: string;
  } {
    return {
      color: input.color,
    };
  },
};
