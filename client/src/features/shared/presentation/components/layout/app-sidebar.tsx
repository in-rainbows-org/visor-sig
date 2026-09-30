"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { AppRole, DEFAULT_ROLE } from "@/lib/auth-roles";
import { getRoutesForRole } from "@/features/shared/config/routes.config";
import { clearJWT } from "@/features/shared/infrastructure/http/jwt-manager";
import { appToast } from "../notifications/toast";

export type AppSidebarProps = {
  className?: string;
};

export function AppSidebar({ className }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = authClient.useSession();

  const userRole = (session?.user?.role as AppRole) || DEFAULT_ROLE;
  const navigationRoutes = getRoutesForRole(userRole);

  const handleSignOut = async () => {
    try {
      clearJWT();
      const { error } = await authClient.signOut();
      if (error) {
        appToast.error(
          "Error al cerrar sesión",
          "Tuvimos un error al cerrar tu sesión."
        );
        return;
      }
      appToast.info("Cerrando sesión. ¡Hasta luego!");
      router.replace("/auth/login");
    } catch {
      appToast.error(
        "Error al cerrar sesión",
        "Ocurrió un error inesperado al cerrar sesión."
      );
    }
  };

  return (
    <aside
      className={`w-14 bg-white border-r border-gray-200/80 hidden lg:flex flex-col items-center py-4 gap-4 z-20 shrink-0 select-none ${
        className || ""
      }`}
      data-purpose="icon-sidebar"
    >
      {/* Top Navigation Items */}
      <div className="flex flex-col items-center gap-4 w-full">
        {navigationRoutes.map((route) => {
          const Icon = route.icon;
          const isActive =
            pathname === route.href ||
            (route.href !== "/mapa" && pathname.startsWith(route.href));

          return (
            <Link
              key={route.key}
              href={route.href}
              aria-label={route.label}
              title={route.label}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition relative ${
                isActive
                  ? "bg-blue-50 text-blue-600 shadow-xs hover:bg-blue-100"
                  : "text-gray-400 hover:text-gray-700 hover:bg-gray-100"
              }`}
            >
              {isActive && (
                <div className="w-1.5 h-4 bg-blue-600 rounded-r-md absolute left-0 top-3" />
              )}
              <Icon className="w-5 h-5" />
            </Link>
          );
        })}
      </div>

      {/* Bottom: Cerrar sesión (Logout) */}
      <div className="mt-auto flex flex-col items-center w-full">
        <button
          type="button"
          onClick={handleSignOut}
          aria-label="Cerrar sesión"
          title="Cerrar sesión"
          className="w-10 h-10 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition cursor-pointer"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </aside>
  );
}

export default AppSidebar;
