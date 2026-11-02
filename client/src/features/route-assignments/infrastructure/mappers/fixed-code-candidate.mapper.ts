import type { FixedCodeCandidate } from "../../domain/entities/fixed-code-candidate.entity";
import type { FixedCodeCandidateResponse } from "../schemas/fixed-code-candidate.schemas";

export const fixedCodeCandidateMapper = {
  toDomain(dto: FixedCodeCandidateResponse): FixedCodeCandidate {
    return {
      id: dto.id,
      fixedCode: dto.fixed_code,
      name: dto.name,
      status: dto.status,
      latitude: dto.latitude,
      longitude: dto.longitude,
    };
  },

  toDomainList(list: FixedCodeCandidateResponse[]): FixedCodeCandidate[] {
    return list.map(fixedCodeCandidateMapper.toDomain);
  },
};
