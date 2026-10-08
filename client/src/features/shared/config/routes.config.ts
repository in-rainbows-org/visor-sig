import { AppRole, APP_ROLES } from "@/lib/auth-roles";

export type NavigationRoute = {
  key: string;
  label: string;
  shortLabel?: string;
  href: string;
  icon: string;
  allowedRoles: AppRole[];
};

export const APP_ROUTES: NavigationRoute[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    shortLabel: "Dashboard",
    href: "/dashboard",
    icon: "/navigation-icons/dashboard.webp",
    allowedRoles: [APP_ROLES.ADMIN],
  },
  {
    key: "mapa",
    label: "Mapa",
    shortLabel: "Mapa",
    href: "/mapa",
    icon: "/navigation-icons/mapa.webp",
    allowedRoles: [APP_ROLES.ADMIN, APP_ROLES.CONSULTANT],
  },
  {
    key: "bitacora",
    label: "Bitácora del Sistema",
    shortLabel: "Bitácora",
    href: "/bitacora",
    icon: "/navigation-icons/bitacora.webp",
    allowedRoles: [APP_ROLES.ADMIN],
  },
  {
    key: "reportes",
    label: "Historial y Reportes",
    shortLabel: "Reportes",
    href: "/reportes",
    icon: "/navigation-icons/reportes.webp",
    allowedRoles: [APP_ROLES.CONSULTANT],
  },
  {
    key: "consultar",
    label: "Consultas",
    shortLabel: "Consultas",
    href: "/consultar",
    icon: "/navigation-icons/consultas.webp",
    allowedRoles: [APP_ROLES.ADMIN, APP_ROLES.CONSULTANT],
  },
  {
    key: "usuarios",
    label: "Usuarios",
    shortLabel: "Usuarios",
    href: "/usuarios",
    icon: "/navigation-icons/usuarios.webp",
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
