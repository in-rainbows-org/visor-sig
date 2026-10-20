"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";

type LayoutScrollContextValue = {
  /** Indica si hay un PageHero montado en la vista actual */
  isHeroMounted: boolean;
  /** Actualiza la presencia del hero en el layout */
  setIsHeroMounted: (mounted: boolean) => void;
};

const LayoutScrollContext = createContext<LayoutScrollContextValue>({
  isHeroMounted: false,
  setIsHeroMounted: () => {},
});

/**
 * Hook para coordinar la presencia y desplazamiento del PageHero con el layout protegido.
 */
export function useLayoutScroll() {
  return useContext(LayoutScrollContext);
}

/**
 * Proveedor de contexto para sincronizar el estado de montaje y la variable
 * CSS de desplazamiento (--hero-scroll-y) del PageHero.
 */
export function LayoutScrollProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isHeroMounted, setIsHeroMounted] = useState(false);
  const pathname = usePathname();

  // Al cambiar de ruta, reiniciamos la variable de scroll del hero
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.style.setProperty("--hero-scroll-y", "0px");
    }
  }, [pathname]);

  return (
    <LayoutScrollContext.Provider value={{ isHeroMounted, setIsHeroMounted }}>
      {children}
    </LayoutScrollContext.Provider>
  );
}
