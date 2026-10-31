"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { AppRole, DEFAULT_ROLE } from "@/lib/auth-roles";
import { getRoutesForRole } from "@/features/shared/config/routes.config";
import { useMagnifyingDock } from "./use-magnifying-dock";
import { DockTravelingTip } from "./dock-traveling-tip";

export type AppBottomNavProps = {
  className?: string;
};

export function AppBottomNav({ className = "" }: AppBottomNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = authClient.useSession();

  const userRole = (session?.user?.role as AppRole) || DEFAULT_ROLE;
  const navigationRoutes = getRoutesForRole(userRole);

  const { bindBar, barRef, hover, choseRef, getItemTransform } =
    useMagnifyingDock({
      orientation: "horizontal",
      magnify: 1.3,
      spread: 0,
      lift: 8,
      onSelect: (index) => {
        const route = navigationRoutes[index];
        if (route) {
          router.push(route.href);
        }
      },
    });

  return (
    <nav
      aria-label="Navegación Móvil"
      data-purpose="bottom-nav-dock"
      {...bindBar}
      className={`fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-40 bg-white/95 backdrop-blur-xl border border-slate-200/70 rounded-full p-1.5 flex items-center gap-1.5 shadow-none max-w-[calc(100vw-1.5rem)] select-none touch-pan-y overscroll-none overflow-visible lg:hidden ${className}`}
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
            className={`dock-item w-12 h-12 rounded-full flex items-center justify-center transition-colors duration-200 focus:outline-hidden relative group shrink-0 ${
              isActive
                ? "bg-gradient-to-b from-[#1a6de9] to-[#0e4dcb] text-white shadow-none"
                : "hover:bg-slate-100/90 active:bg-slate-100"
            }`}
            onClick={(e) => {
              if (choseRef.current) {
                e.preventDefault();
              }
            }}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <span
              className="flex items-center justify-center transition-transform duration-200 ease-[cubic-bezier(0.24,1.34,0.38,1)] will-change-transform origin-bottom"
              style={style}
            >
              <Image
                src={route.icon}
                alt={route.label}
                width={32}
                height={32}
                className={`w-[28px] h-[28px] shrink-0 object-contain transition-opacity duration-200 ${
                  isActive
                    ? "opacity-100 drop-shadow-[0_2px_4px_rgba(0,0,0,0.16)]"
                    : "opacity-80 group-hover:opacity-100"
                }`}
              />
            </span>
          </Link>
        );
      })}

      {/* Label viajero animado que sigue el dedo o mouse por encima del dock */}
      <DockTravelingTip
        barRef={barRef}
        at={hover}
        items={navigationRoutes}
        orientation="horizontal"
        theme="light"
      />
    </nav>
  );
}

export default AppBottomNav;
