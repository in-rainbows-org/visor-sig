export type HighlightedMapEntity = {
  id: string;
  layerKind: string;
  code: string;
  fixedCodeNumber?: string | number;
  name?: string;
  uv?: string;
  mz?: string;
  lote?: string;
  status: string;
  statusVal: number;
  statusColor: string;
  lat: number;
  lng: number;
};
