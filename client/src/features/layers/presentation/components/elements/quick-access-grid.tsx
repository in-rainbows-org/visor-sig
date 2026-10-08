"use client";

import React from "react";
import { QuickAccessCard, type QuickAccessItem } from "./quick-access-card";

export const DEFAULT_QUICK_ACCESS_ITEMS: QuickAccessItem[] = [
  {
    key: "consultas",
    title: "Consultas",
    description: "Búsqueda y análisis alfanumérico sobre registros catastrales.",
    href: "/consultar",
    iconSrc: "/dashboard-icons/consulta.webp",
  },
  {
    key: "bitacora",
    title: "Bitácora",
    description: "Auditoría del sistema y registro cronológico de eventos.",
    href: "/bitacora",
    iconSrc: "/dashboard-icons/logs.webp",
  },
  {
    key: "mapa",
    title: "Mapa",
    description: "Exploración cartográfica interactiva y visualización espacial.",
    href: "/mapa",
    iconSrc: "/dashboard-icons/map.webp",
  },
  {
    key: "usuarios",
    title: "Usuarios",
    description: "Gestión de cuentas, asignación de roles y accesos del personal.",
    href: "/usuarios",
    iconSrc: "/dashboard-icons/users.webp",
  },
];

export type QuickAccessGridProps = {
  items?: QuickAccessItem[];
};

export function QuickAccessGrid({
  items = DEFAULT_QUICK_ACCESS_ITEMS,
}: QuickAccessGridProps) {
  return (
    <div className="space-y-4 pt-2">
      <div>
        <h3 className="text-base font-bold text-slate-900 tracking-tight">
          Accesos Rápidos
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Atajos directos para navegación entre los módulos principales de la plataforma.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
        {items.map((item) => (
          <QuickAccessCard key={item.key} item={item} />
        ))}
      </div>
    </div>
  );
}

export default QuickAccessGrid;
