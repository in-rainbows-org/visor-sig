import "server-only";
import { cache } from "react";
import { mapRepositoryImpl } from "../../infrastructure/repositories/map.repository-impl";

export const getActiveMacroLayersQuery = cache(async () => {
  return mapRepositoryImpl.getActiveMacroLayers();
});
