import type { ApiResult } from "@/features/shared/domain/types/api-results";
import type { FixedCodeCandidate } from "../entities/fixed-code-candidate.entity";

export type RouteCandidateRepository = {
  searchCodigosFijosForAssignment(
    fixedCode: number,
    limit?: number
  ): Promise<ApiResult<FixedCodeCandidate[]>>;
};
