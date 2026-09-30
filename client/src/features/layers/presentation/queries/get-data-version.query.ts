import { httpDataVersionRepository } from "../../infrastructure/repositories/http-data-version.repository";

export async function getDataVersionQuery(layerId: string, versionId: string) {
  return httpDataVersionRepository.getById(layerId, versionId);
}
