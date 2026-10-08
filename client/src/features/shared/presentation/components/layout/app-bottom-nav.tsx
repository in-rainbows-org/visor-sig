"use client";

import React from "react";
import Image from "next/image";
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
      className={`fixed bottom-5 sm:bottom-6 left-1/2 -translate-x-1/2 z-40 bg-white/95 backdrop-blur-md rounded-full shadow-float border border-slate-200/90 px-3 py-1.5 sm:px-4 sm:py-2 flex items-center gap-1.5 sm:gap-2.5 max-w-[calc(100vw-1.5rem)] select-none touch-none overscroll-none lg:hidden ${className}`}
    >
      {navigationRoutes.map((route) => {
        const isActive =
          pathname === route.href ||
          (route.href !== "/mapa" && pathname.startsWith(route.href));

        return (
          <Link
            key={route.key}
            href={route.href}
            className={`flex flex-col items-center gap-1 transition-all duration-150 focus:outline-hidden py-1 px-2.5 sm:px-3 rounded-xl active:scale-95 ${
              isActive
                ? "text-blue-600 font-bold"
                : "text-slate-500 hover:text-slate-900 font-medium"
            }`}
          >
            <Image
              src={route.icon}
              alt={route.label}
              width={28}
              height={28}
              className={`w-[26px] h-[26px] sm:w-7 sm:h-7 shrink-0 object-contain transition-transform duration-200 ${
                isActive
                  ? "scale-110 drop-shadow-[0_2px_4px_rgba(37,99,235,0.25)]"
                  : "opacity-85 hover:opacity-100"
              }`}
            />
            <span className="text-[10.5px] sm:text-[11.5px] leading-tight tracking-tight text-center">
              {route.shortLabel || route.label}
            </span>
            <span
              className={`h-0.5 rounded-full transition-all duration-200 ${
                isActive ? "w-4.5 bg-blue-600" : "w-0 bg-transparent"
              }`}
            />
          </Link>
        );
      })}
    </nav>
  );
}

export default AppBottomNav;
