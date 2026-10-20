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
      className={`w-[75px] bg-white border-0 shadow-none hidden lg:flex flex-col items-center py-4 gap-3.5 z-20 shrink-0 select-none lg:rounded-tr-[32px] overflow-hidden ${
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
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 relative group ${
                isActive
                  ? "bg-gradient-to-b from-[#1a6de9] to-[#0e4dcb] text-white shadow-[0_4px_14px_rgba(14,77,203,0.32),inset_0_1px_1px_rgba(255,255,255,0.4)]"
                  : "hover:bg-slate-100/90 active:scale-95"
              }`}
            >
              <Image
                src={route.icon}
                alt={route.label}
                width={32}
                height={32}
                className={`w-[27px] h-[27px] object-contain transition-all duration-200 ${
                  isActive
                    ? "scale-105 drop-shadow-[0_2px_4px_rgba(0,0,0,0.18)]"
                    : "opacity-75 group-hover:opacity-100 group-hover:scale-110"
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
          className="w-12 h-12 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors duration-150 cursor-pointer group"
        >
          <Image
            src="/navigation-icons/logout.webp"
            alt="Cerrar sesión"
            width={32}
            height={32}
            className="w-[28px] h-[28px] object-contain opacity-75 group-hover:opacity-100 group-hover:scale-105 transition-transform duration-200"
          />
        </button>
      </div>
    </aside>
  );
}

export default AppSidebar;
