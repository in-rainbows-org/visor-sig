"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { AppRole, DEFAULT_ROLE } from "@/lib/auth-roles";
import { getRoutesForRole } from "@/features/shared/config/routes.config";
import { clearJWT } from "@/features/shared/infrastructure/http/jwt-manager";
import { recordLogoutAuditAction } from "@/features/audit-logs/presentation/hooks/use-audit-auth-log";
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
      await recordLogoutAuditAction();
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
      className={`w-[75px] bg-white border-r border-gray-200/80 hidden lg:flex flex-col items-center py-4 gap-3.5 z-20 shrink-0 select-none ${
        className || ""
      }`}
      data-purpose="icon-sidebar"
    >
      {/* Top Navigation Items */}
      <div className="flex flex-col items-center gap-3 w-full">
        {navigationRoutes.map((route) => {
          const isActive =
            pathname === route.href ||
            (route.href !== "/mapa" && pathname.startsWith(route.href));

          return (
            <Link
              key={route.key}
              href={route.href}
              aria-label={route.label}
              title={route.label}
              className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all relative group ${
                isActive
                  ? "bg-blue-50/90 shadow-xs border border-blue-200/70"
                  : "hover:bg-slate-100/80"
              }`}
            >
              {isActive && (
                <div className="w-1 h-6 bg-blue-600 rounded-r-full absolute left-0 top-1/2 -translate-y-1/2" />
              )}
              <Image
                src={route.icon}
                alt={route.label}
                width={36}
                height={36}
                className={`w-[32px] h-[32px] object-contain transition-transform duration-200 ${
                  isActive
                    ? "scale-105 drop-shadow-[0_2px_6px_rgba(37,99,235,0.22)]"
                    : "opacity-80 group-hover:opacity-100 group-hover:scale-105"
                }`}
              />
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
          className="w-12 h-12 rounded-xl text-gray-400 hover:bg-red-50/80 flex items-center justify-center transition-all cursor-pointer group"
        >
          <Image
            src="/navigation-icons/logout.webp"
            alt="Cerrar sesión"
            width={36}
            height={36}
            className="w-[34px] h-[34px] object-contain opacity-75 group-hover:opacity-100 group-hover:scale-105 transition-transform duration-200"
          />
        </button>
      </div>
    </aside>
  );
}

export default AppSidebar;
