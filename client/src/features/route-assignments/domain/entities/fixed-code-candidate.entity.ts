/**
 * Entidad de dominio que representa un candidato de código fijo
 * disponible para ser agregado a una ruta de inspección territorial.
 */
export type FixedCodeCandidate = {
  id: string;
  fixedCode: number | null;
  name: string | null;
  status: number;
  latitude: number;
  longitude: number;
};
