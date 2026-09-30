import { httpLayerRepository } from "../../infrastructure/repositories/http-layer.repository";

export async function listLayersQuery() {
  return httpLayerRepository.list();
}
