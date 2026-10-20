"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { BrandLogo } from "@/features/shared/presentation/components/elements/brand-logo";
import { authClient } from "@/lib/auth-client";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { clearJWT } from "@/features/shared/infrastructure/http/jwt-manager";
import { recordLogoutAuditAction } from "@/features/audit-logs/presentation/hooks/use-audit-auth-log";
import { appToast } from "@/features/shared/presentation/components/notifications/toast";
import { User, LogOut } from "lucide-react";

export type AppHeaderProps = {
  className?: string;
};

export function AppHeader({ className }: AppHeaderProps) {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [profileOpen, setProfileOpen] = useState(false);

  const userName = session?.user?.name || "Usuario";
  const userEmail = session?.user?.email || "";
  const userImage = session?.user?.image;

  const handleSignOut = async () => {
    try {
      setProfileOpen(false);
      await recordLogoutAuditAction();
      clearJWT();
      const { error } = await authClient.signOut();
      if (error) {
        appToast.error(
          "Error al cerrar sesión",
          "Tuvimos un problema al cerrar tu sesión."
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
    <header
      className={`h-20 lg:h-[77px] bg-[#0e4dcb] bg-hero-gradient-header text-white border-0 shadow-none px-5 sm:px-6 lg:px-8 flex items-center justify-between z-30 relative shrink-0 select-none touch-none overscroll-none rounded-b-[40px] sm:rounded-b-[48px] lg:rounded-bl-none lg:rounded-br-[48px] ${
        className || ""
      }`}
      style={{
        backgroundImage:
          "linear-gradient(to right, #0e4dcb 0%, #135ad6 28%, #1c6ee7 68%, #3392f9 100%)",
        backgroundSize: "100vw 100%",
        backgroundPosition: "0 0",
      }}
      data-purpose="top-header"
    >
      {/* Brand Logo Section */}
      <div className="flex items-center gap-3">
        <BrandLogo size="header" showText={true} href="/mapa" textColor="white" />
      </div>

      {/* User Profile Greeting & Popover Dropdown */}
      <div className="flex items-center gap-3 transition">
        {isPending ? (
          <div className="flex items-center gap-3">
            <Skeleton className="h-5 w-32 hidden sm:block" />
            <Skeleton className="w-10 h-10 rounded-full" />
          </div>
        ) : (
          <Popover open={profileOpen} onOpenChange={setProfileOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-3 transition cursor-pointer hover:opacity-90 focus:outline-hidden p-1 sm:py-1.5 sm:px-2.5 rounded-full sm:rounded-xl hover:bg-white/10"
                aria-label="Menú de perfil de usuario"
              >
                <span className="text-sm sm:text-base font-medium text-blue-100 truncate max-w-[150px] sm:max-w-xs md:max-w-none hidden sm:inline">
                  Hola, <strong className="text-white font-semibold">{userName}</strong>
                </span>
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 border-white/40 text-white flex items-center justify-center bg-white/15 overflow-hidden shrink-0">
                  {userImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={userImage}
                      alt={userName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-5 h-5 text-white" />
                  )}
                </div>
              </button>
            </PopoverTrigger>

            <PopoverContent
              align="end"
              sideOffset={12}
              className="p-0 border-0 bg-transparent shadow-none w-auto max-w-[calc(100vw-2rem)] z-[2100]"
            >
              <div
                className="bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-float border border-gray-100 select-none w-72 flex flex-col gap-3"
                data-purpose="user-profile-card"
              >
                {/* 1. Título e Identidad de la Aplicación */}
                <div className="flex items-center justify-between border-b border-gray-100/80 pb-2.5">
                  <BrandLogo size="sm" showText={true} />
                  <span className="text-[10px] text-gray-400 font-medium px-2 py-0.5 rounded-full bg-gray-100">
                    Cuenta
                  </span>
                </div>

                {/* 2. Avatar centrado */}
                <div className="flex flex-col items-center justify-center pt-1 text-center">
                  <div className="w-16 h-16 rounded-full border-2 border-blue-100 text-gray-500 flex items-center justify-center bg-gray-50 overflow-hidden shadow-xs shrink-0">
                    {userImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={userImage}
                        alt={userName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-8 h-8 text-gray-400" />
                    )}
                  </div>

                  {/* 3. Nombre de la cuenta/usuario centrado */}
                  <h4 className="text-sm font-bold text-gray-900 mt-2.5 tracking-tight truncate max-w-full">
                    {userName}
                  </h4>

                  {/* 4. Correo electrónico centrado */}
                  {userEmail && (
                    <p className="text-xs text-gray-500 font-medium truncate max-w-full mt-0.5">
                      {userEmail}
                    </p>
                  )}
                </div>

                {/* 5. Divisor y Botón Cerrar Sesión */}
                <div className="pt-2 border-t border-gray-100/80">
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100/80 rounded-xl transition cursor-pointer active:scale-98 shadow-2xs"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Cerrar sesión</span>
                  </button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
    </header>
  );
}

export default AppHeader;
