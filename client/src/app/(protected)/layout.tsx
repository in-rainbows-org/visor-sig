import React from "react";
import { AppHeader } from "@/features/shared/presentation/components/layout/app-header";
import { AppSidebar } from "@/features/shared/presentation/components/layout/app-sidebar";
import { AppBottomNav } from "@/features/shared/presentation/components/layout/app-bottom-nav";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-[#f5f6fa] text-gray-800 font-sans h-screen w-screen overflow-hidden flex flex-col select-none">
      {/* 1. Cabecera fija superior de 56px */}
      <AppHeader />

      {/* 2. Cuerpo del Dashboard */}
      <div className="flex flex-1 relative overflow-hidden">
        {/* Riel de navegación lateral izquierdo (solo en pantallas >= 1024px) */}
        <AppSidebar />

        {/* Lienzo o vista hija principal */}
        <main className="flex-1 relative overflow-hidden bg-slate-100">
          {children}
        </main>
      </div>

      {/* 3. Barra de navegación flotante inferior (solo en móviles y tablets < 1024px) */}
      <AppBottomNav />
    </div>
  );
}
