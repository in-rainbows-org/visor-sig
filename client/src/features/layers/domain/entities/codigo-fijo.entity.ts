export interface CodigoFijo {
  id: string;
  dataVersionId: string | null;
  fixedCode: number;
  name: string;
  latitude: number;
  longitude: number;
  status: number;
  statusChangedAt: string;
  sqlCode: number | null;
  sigCode: string | null;
  loteId: string | null;
}

export interface CreateCodigoFijoInput {
  fixedCode: number;
  name: string;
  latitude: number;
  longitude: number;
  status?: number;
}
