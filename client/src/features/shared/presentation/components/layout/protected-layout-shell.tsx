"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { AppHeader } from "./app-header";
import { AppSidebar } from "./app-sidebar";
import { AppBottomNav } from "./app-bottom-nav";
import { useLayoutScroll } from "@/features/shared/presentation/context/layout-scroll-context";

/**
 * Envoltorio interactivo del dashboard protegido.
 * Gestiona el solapamiento con la cabecera y el bloque azul físico
 * que se desplaza en sincronía 1:1 con el scroll del PageHero.
 */
export function ProtectedLayoutShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { isHeroMounted } = useLayoutScroll();

  const isMapPage = pathname === "/mapa";

  return (
    <div className="bg-[#f5f6fa] text-gray-800 font-sans fixed inset-0 w-full h-[100dvh] max-h-[100dvh] overflow-hidden flex flex-col select-none overscroll-none">
      {/* 1. Cabecera fija superior (azul primario, más alta en desktop) */}
      <AppHeader />

      {/* 2. Cuerpo del Dashboard */}
      <div className="flex flex-1 relative min-h-0 w-full lg:bg-slate-100">
        {/* Riel de navegación lateral izquierdo (solo en pantallas >= 1024px) */}
        <AppSidebar />

        {/* Fragmento azul con rectángulo superior y curva hacia adentro (cóncava) desplazada hacia abajo
            Encaja a la perfección con la silueta del sidebar y se desplaza verticalmente con el scroll del PageHero. */}
        {!isMapPage && isHeroMounted && (
          <div
            data-purpose="sidebar-hero-corner-fill"
            className="hidden lg:block absolute top-0 left-[43px] w-[34px] pointer-events-none z-10 text-[#0e4dcb]"
            style={{
              height: "300px",
              transform: "translate3d(0, calc(-1 * var(--hero-scroll-y, 0px)), 0)",
              willChange: "transform",
            }}
          >
            <svg
              width="34"
              height="300"
              viewBox="0 0 34 300"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-full"
            >
              <path
                d="M 0 0 L 0 180 A 80 40 0 0 1 32 215 L 32 300 L 34 300 L 34 0 Z"
                fill="#0e4dcb"
              />
            </svg>
          </div>
        )}

        {/* Lienzo o vista hija principal:
            En páginas con hero se solapa hacia arriba colocándose por detrás de la
            cabecera (z-10 vs z-30), asegurando una unión 100% continua bajo las esquinas curvas. */}
        <main
          className={cn(
            "flex-1 relative overflow-hidden bg-slate-100 min-h-0 w-full",
            !isMapPage &&
              "-mt-11 lg:-mt-9 h-[calc(100%+2.75rem)] lg:h-[calc(100%+2.25rem)] z-10"
          )}
        >
          {children}
        </main>
      </div>

      {/* 3. Barra de navegación flotante inferior (solo en móviles y tablets < 1024px) */}
      <AppBottomNav />
    </div>
  );
}

export default ProtectedLayoutShell;
