/**
 * Representa a un técnico u operador de campo elegible para recibir
 * asignaciones de rutas territoriales.
 */
export type RouteTechnicianOption = {
  id: string;
  name: string;
  email?: string | null;
  image?: string | null;
};
