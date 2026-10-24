"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { AppHeader } from "./app-header";
import { AppSidebar } from "./app-sidebar";
import { AppBottomNav } from "./app-bottom-nav";

/**
 * Envoltorio interactivo del dashboard protegido.
 */
export function ProtectedLayoutShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isMapPage = pathname === "/mapa";

  return (
    <div className="bg-[#f5f6fa] text-gray-800 font-sans fixed inset-0 w-full h-[100dvh] max-h-[100dvh] overflow-hidden flex flex-col select-none overscroll-none">
      {/* 1. Cabecera fija superior (azul primario, más alta en desktop) */}
      <AppHeader />

      {/* 2. Cuerpo del Dashboard */}
      <div className="flex flex-1 relative min-h-0 w-full lg:bg-slate-100">
        {/* Riel de navegación lateral izquierdo (solo en pantallas >= 1024px) */}
        <AppSidebar />

        {/* Lienzo o vista hija principal:
            En páginas con hero se solapa hacia arriba por detrás de la cabecera
            y permite visibilidad en desktop (lg:overflow-visible) para que la pestaña lateral
            del PageHero pueda extenderse por detrás del sidebar. */}
        <main
          className={cn(
            "flex-1 relative overflow-hidden bg-slate-100 min-h-0 w-full",
            !isMapPage
              ? "-mt-11 lg:-mt-9 lg:overflow-visible h-[calc(100%+2.75rem)] lg:h-[calc(100%+2.25rem)] z-10"
              : "-mt-20 lg:-mt-[77px] h-[calc(100%+5rem)] lg:h-[calc(100%+77px)] lg:-ml-[75px] lg:w-[calc(100%+75px)] z-10"
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
