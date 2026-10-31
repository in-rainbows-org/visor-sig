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
import { useMagnifyingDock } from "./use-magnifying-dock";
import { DockTravelingTip } from "./dock-traveling-tip";

export type AppSidebarProps = {
  className?: string;
};

export function AppSidebar({ className }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = authClient.useSession();

  const userRole = (session?.user?.role as AppRole) || DEFAULT_ROLE;
  const navigationRoutes = getRoutesForRole(userRole);

  const { bindBar, barRef, hover, getItemTransform } = useMagnifyingDock({
    orientation: "vertical",
    magnify: 1.25,
    spread: 0,
    lift: 6,
  });

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
      className={`w-[75px] bg-white border-0 shadow-none hidden lg:flex flex-col items-center py-4 gap-3.5 z-30 shrink-0 select-none lg:rounded-tr-[32px] overflow-visible relative ${
        className || ""
      }`}
      data-purpose="icon-sidebar"
    >
      {/* Top Navigation Items: Riel con física Magnifying Dock vertical */}
      <nav
        aria-label="Navegación Principal"
        {...bindBar}
        className="flex flex-col items-center gap-3 w-full relative"
      >
        {navigationRoutes.map((route, index) => {
          const isActive =
            pathname === route.href ||
            (route.href !== "/mapa" && pathname.startsWith(route.href));

          const { style } = getItemTransform(index);

          return (
            <Link
              key={route.key}
              href={route.href}
              aria-label={route.label}
              className={`dock-item w-12 h-12 rounded-full flex items-center justify-center transition-colors duration-200 relative group shrink-0 ${
                isActive
                  ? "bg-gradient-to-b from-[#1a6de9] to-[#0e4dcb] text-white shadow-[0_4px_14px_rgba(14,77,203,0.32),inset_0_1px_1px_rgba(255,255,255,0.4)]"
                  : "hover:bg-slate-100/90 active:scale-95"
              }`}
            >
              <span
                className="flex items-center justify-center transition-transform duration-200 ease-[cubic-bezier(0.24,1.34,0.38,1)] will-change-transform origin-center"
                style={style}
              >
                <Image
                  src={route.icon}
                  alt={route.label}
                  width={32}
                  height={32}
                  className={`w-[27px] h-[27px] object-contain transition-opacity duration-200 ${
                    isActive
                      ? "opacity-100 drop-shadow-[0_2px_4px_rgba(0,0,0,0.18)]"
                      : "opacity-75 group-hover:opacity-100"
                  }`}
                />
              </span>
            </Link>
          );
        })}

        {/* Label viajero animado que se desliza verticalmente al lado derecho */}
        <DockTravelingTip
          barRef={barRef}
          at={hover}
          items={navigationRoutes}
          orientation="vertical"
          theme="light"
        />
      </nav>

      {/* Bottom: Cerrar sesión (Logout) */}
      <div className="mt-auto flex flex-col items-center w-full">
        <button
          type="button"
          onClick={handleSignOut}
          aria-label="Cerrar sesión"
          className="w-12 h-12 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors duration-150 cursor-pointer relative group"
        >
          <span className="flex items-center justify-center transition-transform duration-200 ease-[cubic-bezier(0.24,1.34,0.38,1)] group-hover:scale-110">
            <Image
              src="/navigation-icons/logout.webp"
              alt="Cerrar sesión"
              width={32}
              height={32}
              className="w-[28px] h-[28px] object-contain opacity-75 group-hover:opacity-100 transition-opacity duration-200"
            />
          </span>

          {/* Label ovalado al lado derecho en hover */}
          <div
            role="tooltip"
            className="pointer-events-none absolute left-[calc(100%+14px)] top-1/2 -translate-y-1/2 z-50 hidden lg:flex items-center opacity-0 -translate-x-1.5 scale-95 group-hover:opacity-100 group-hover:scale-100 group-hover:translate-x-0 transition-all duration-160 ease-[cubic-bezier(0.22,1,0.36,1)]"
          >
            <div className="relative bg-white text-slate-800 text-xs font-semibold px-3.5 h-8 flex items-center justify-center rounded-full border border-slate-200/80 shadow-[0_4px_16px_rgba(15,23,42,0.1)] whitespace-nowrap select-none">
              <span>Cerrar sesión</span>
            </div>
          </div>
        </button>
      </div>
    </aside>
  );
}

export default AppSidebar;
