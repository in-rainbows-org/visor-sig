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
      className={`fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-40 bg-white/95 backdrop-blur-xl border border-slate-100 rounded-full p-1.5 flex items-center gap-1.5 shadow-[0_12px_32px_rgba(0,0,0,0.12),0_2px_6px_rgba(0,0,0,0.06)] max-w-[calc(100vw-1.5rem)] select-none touch-none overscroll-none lg:hidden ${className}`}
    >
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
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 focus:outline-hidden ${
              isActive
                ? "bg-gradient-to-b from-[#1a6de9] to-[#0e4dcb] text-white shadow-[0_4px_14px_rgba(14,77,203,0.32),inset_0_1px_1px_rgba(255,255,255,0.4)] scale-105"
                : "hover:bg-slate-100/90 active:bg-slate-100 active:scale-95"
            }`}
          >
            <Image
              src={route.icon}
              alt={route.label}
              width={32}
              height={32}
              className={`w-[28px] h-[28px] shrink-0 object-contain transition-transform duration-200 ${
                isActive
                  ? "scale-105 drop-shadow-[0_2px_4px_rgba(0,0,0,0.18)]"
                  : "opacity-80 hover:opacity-100"
              }`}
            />
          </Link>
        );
      })}
    </nav>
  );
}

export default AppBottomNav;
