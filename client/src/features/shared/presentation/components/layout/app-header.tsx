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
      className={`h-14 bg-white border-b border-gray-200/80 px-4 flex items-center justify-between z-30 shadow-xs shrink-0 select-none ${
        className || ""
      }`}
      data-purpose="top-header"
    >
      {/* Brand Logo Section */}
      <div className="flex items-center gap-3">
        <BrandLogo size="sm" showText={true} href="/mapa" />
      </div>

      {/* User Profile Greeting & Popover Dropdown */}
      <div className="flex items-center gap-2.5 transition">
        {isPending ? (
          <div className="flex items-center gap-2.5">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="w-8 h-8 rounded-full" />
          </div>
        ) : (
          <Popover open={profileOpen} onOpenChange={setProfileOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-2.5 transition cursor-pointer hover:opacity-85 focus:outline-hidden py-1 px-1.5 rounded-lg hover:bg-gray-100/60"
                aria-label="Menú de perfil de usuario"
              >
                <span className="text-sm font-medium text-gray-600 truncate max-w-[140px] sm:max-w-xs md:max-w-none">
                  Hi, <strong className="text-gray-900 font-semibold">{userName}</strong>
                </span>
                <div className="w-8 h-8 rounded-full border border-gray-300 text-gray-500 flex items-center justify-center bg-gray-50 overflow-hidden shrink-0 shadow-2xs">
                  {userImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={userImage}
                      alt={userName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-4 h-4 text-gray-500" />
                  )}
                </div>
              </button>
            </PopoverTrigger>

            <PopoverContent
              align="end"
              sideOffset={12}
              className="p-0 border-0 bg-transparent shadow-none w-auto max-w-[calc(100vw-2rem)] z-50"
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
