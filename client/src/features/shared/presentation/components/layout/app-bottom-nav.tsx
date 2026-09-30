"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { AppRole, DEFAULT_ROLE } from "@/lib/auth-roles";
import { getRoutesForRole } from "@/features/shared/config/routes.config";

export type AppBottomNavProps = {
  className?: string;
};

export function AppBottomNav({ className = "" }: AppBottomNavProps) {
  const pathname = usePathname();
  const { data: session } = authClient.useSession();

  const userRole = (session?.user?.role as AppRole) || DEFAULT_ROLE;
  const navigationRoutes = getRoutesForRole(userRole);

  return (
    <nav
      aria-label="Navegación Móvil"
      data-purpose="bottom-nav-dock"
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-white/95 backdrop-blur-md rounded-full shadow-float border border-gray-200/80 px-4 sm:px-6 py-2 flex items-center gap-3 sm:gap-5 max-w-[calc(100vw-2rem)] select-none lg:hidden ${className}`}
    >
      {navigationRoutes.map((route, index) => {
        const Icon = route.icon;
        const isActive =
          pathname === route.href ||
          (route.href !== "/mapa" && pathname.startsWith(route.href));

        return (
          <React.Fragment key={route.key}>
            {index > 0 && <div className="h-6 w-px bg-gray-200/80 shrink-0" />}

            <Link
              href={route.href}
              className={`flex flex-col items-center gap-1 transition focus:outline-hidden py-0.5 px-1.5 rounded-lg ${
                isActive
                  ? "text-blue-600 font-bold"
                  : "text-gray-500 hover:text-gray-900 font-medium"
              }`}
            >
              <Icon
                className={`w-5 h-5 shrink-0 transition-transform ${
                  isActive ? "scale-105" : ""
                }`}
              />
              <span className="text-[10px] sm:text-xs leading-none tracking-tight">
                {route.shortLabel || route.label}
              </span>
            </Link>
          </React.Fragment>
        );
      })}
    </nav>
  );
}

export default AppBottomNav;
