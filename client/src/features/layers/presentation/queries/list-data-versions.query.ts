import { httpDataVersionRepository } from "../../infrastructure/repositories/http-data-version.repository";

export async function listDataVersionsQuery(layerId: string) {
  return httpDataVersionRepository.listByLayer(layerId);
}
