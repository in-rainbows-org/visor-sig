import { AppRole, APP_ROLES } from "@/lib/auth-roles";
import {
  Map,
  FileText,
  Layers,
  BarChart3,
  Users,
  type LucideIcon,
} from "lucide-react";

export type NavigationRoute = {
  key: string;
  label: string;
  shortLabel?: string;
  href: string;
  icon: LucideIcon;
  allowedRoles: AppRole[];
};

export const APP_ROUTES: NavigationRoute[] = [
  {
    key: "mapa",
    label: "Mapa",
    shortLabel: "Mapa",
    href: "/mapa",
    icon: Map,
    allowedRoles: [APP_ROLES.ADMIN, APP_ROLES.CONSULTANT],
  },
  {
    key: "capas",
    label: "Gestión de Capas",
    shortLabel: "Capas",
    href: "/capas",
    icon: Layers,
    allowedRoles: [APP_ROLES.ADMIN],
  },
  {
    key: "bitacora",
    label: "Bitácora del Sistema",
    shortLabel: "Bitácora",
    href: "/bitacora",
    icon: FileText,
    allowedRoles: [APP_ROLES.ADMIN],
  },
  {
    key: "reportes",
    label: "Historial y Reportes",
    shortLabel: "Reportes",
    href: "/reportes",
    icon: BarChart3,
    allowedRoles: [APP_ROLES.CONSULTANT],
  },
  {
    key: "usuarios",
    label: "Usuarios",
    shortLabel: "Usuarios",
    href: "/usuarios",
    icon: Users,
    allowedRoles: [APP_ROLES.ADMIN],
  },
];

/**
 * Obtiene la lista de rutas accesibles para un rol determinado.
 */
export function getRoutesForRole(role?: AppRole): NavigationRoute[] {
  if (!role) return [];
  return APP_ROUTES.filter((route) => route.allowedRoles.includes(role));
}

/**
 * Verifica si un rol tiene permiso para acceder a una ruta específica.
 */
export function isRouteAllowedForRole(pathname: string, role?: AppRole): boolean {
  if (!role) return false;
  const matchedRoute = APP_ROUTES.find(
    (r) => pathname === r.href || pathname.startsWith(`${r.href}/`)
  );
  if (!matchedRoute) return true; // Rutas no listadas explícitamente se evalúan por política general
  return matchedRoute.allowedRoles.includes(role);
}
