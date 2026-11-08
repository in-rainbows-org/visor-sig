import type {
  CodigoFijo,
  CreateCodigoFijoInput,
} from "../../domain/entities/codigo-fijo.entity";
import type { CodigoFijoReadDto } from "../schemas/codigo-fijo.schemas";

export const codigoFijoMapper = {
  toDomain(dto: CodigoFijoReadDto): CodigoFijo {
    return {
      id: dto.id,
      dataVersionId: dto.data_version_id ?? null,
      fixedCode: dto.fixed_code,
      name: dto.name,
      latitude: dto.latitude,
      longitude: dto.longitude,
      status: dto.status,
      statusChangedAt: dto.status_changed_at,
      sqlCode: dto.sql_code ?? null,
      sigCode: dto.sig_code ?? null,
      loteId: dto.lote_id ?? null,
    };
  },

  toCreatePayload(input: CreateCodigoFijoInput) {
    return {
      fixed_code: input.fixedCode,
      name: input.name.trim(),
      latitude: input.latitude,
      longitude: input.longitude,
      status: input.status ?? 1,
    };
  },
};
