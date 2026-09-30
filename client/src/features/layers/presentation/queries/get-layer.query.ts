import { httpLayerRepository } from "../../infrastructure/repositories/http-layer.repository";

export async function getLayerQuery(layerId: string) {
  return httpLayerRepository.getById(layerId);
}
