import "server-only";
import { cache } from "react";
import { dataVersionRepositoryImpl } from "../../infrastructure/repositories/data-version.repository-impl";

export const listDataVersionsQuery = cache(async (layerId: string) => {
  return dataVersionRepositoryImpl.listByLayer(layerId);
});

