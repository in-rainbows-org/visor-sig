import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "./lib/auth";
import { headers } from "next/headers";
import { AppRole, APP_ROLES, DEFAULT_ROLE } from "./lib/auth-roles";
import { isRouteAllowedForRole } from "./features/shared/config/routes.config";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Obtenemos la sesión de Better Auth
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const isAuthenticated = !!session;
  const userRole = (session?.user?.role as AppRole) || DEFAULT_ROLE;
  const defaultLandingPath = userRole === APP_ROLES.ADMIN ? "/dashboard" : "/mapa";

  // 1. Redirección de la raíz (/)
  if (pathname === "/") {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL(defaultLandingPath, request.url));
    }
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  // 2. Redirección de rutas obsoletas o en inglés hacia las rutas oficiales en español
  const legacyRouteMap: Record<string, string> = {
    "/home": defaultLandingPath,
    "/map": "/mapa",
    "/layers": "/dashboard",
    "/capas": "/dashboard",
    "/audit": "/bitacora",
    "/reports": "/reportes",
    "/historial-reportes": "/reportes",
    "/users": "/usuarios",
    "/consulta": "/consultar",
    "/consultas": "/consultar",
    "/consultation": "/consultar",
  };

  for (const [legacyPath, targetPath] of Object.entries(legacyRouteMap)) {
    if (pathname === legacyPath || pathname.startsWith(`${legacyPath}/`)) {
      const rest = pathname.slice(legacyPath.length);
      const destination = `${targetPath}${rest}`;
      if (!isAuthenticated) {
        const loginUrl = new URL("/auth/login", request.url);
        loginUrl.searchParams.set("callbackURL", destination);
        return NextResponse.redirect(loginUrl);
      }
      return NextResponse.redirect(new URL(destination, request.url));
    }
  }

  // 3. Rutas de autenticación (/auth/*)
  if (pathname.startsWith("/auth/")) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL(defaultLandingPath, request.url));
    }
    return NextResponse.next();
  }

  // 4. Rutas protegidas del dashboard en español (/dashboard, /mapa, /bitacora, /reportes, /usuarios, /consultar)
  const isProtectedRoute =
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/") ||
    pathname === "/mapa" ||
    pathname.startsWith("/mapa/") ||
    pathname === "/bitacora" ||
    pathname.startsWith("/bitacora/") ||
    pathname === "/capas" ||
    pathname.startsWith("/capas/") ||
    pathname === "/reportes" ||
    pathname.startsWith("/reportes/") ||
    pathname === "/usuarios" ||
    pathname.startsWith("/usuarios/") ||
    pathname === "/consultar" ||
    pathname.startsWith("/consultar/");

  if (isProtectedRoute) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/auth/login", request.url);
      loginUrl.searchParams.set("callbackURL", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Validación de acceso por rol
    if (!isRouteAllowedForRole(pathname, userRole)) {
      return NextResponse.redirect(new URL("/mapa", request.url));
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/home",
    "/home/:path*",
    "/auth/:path*",
    "/dashboard",
    "/dashboard/:path*",
    "/mapa",
    "/mapa/:path*",
    "/bitacora",
    "/bitacora/:path*",
    "/capas",
    "/capas/:path*",
    "/reportes",
    "/reportes/:path*",
    "/usuarios",
    "/usuarios/:path*",
    "/consultar",
    "/consultar/:path*",
  ],
};
