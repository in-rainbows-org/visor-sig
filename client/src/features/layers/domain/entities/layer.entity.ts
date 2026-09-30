export type LayerKind = "CODIGOS_FIJOS" | "LOTES" | "MANZANAS" | "VIAS";

export type GeometryType = "POINT" | "LINE" | "POLYGON";

export type LayerColor =
  | "BLUE"
  | "ORANGE"
  | "GREEN"
  | "VIOLET"
  | "RED"
  | "LIGHT_BLUE"
  | "YELLOW";

export type Layer = {
  id: string;
  kind: LayerKind;
  name: string;
  geometryType: GeometryType;
  color: LayerColor;
  activeDataVersionId: string | null;
  updatedAt: string;
};

export type ChangeLayerColorInput = {
  color: LayerColor;
};
