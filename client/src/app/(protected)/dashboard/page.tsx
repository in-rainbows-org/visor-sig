import React from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { APP_ROLES, type AppRole } from "@/lib/auth-roles";
import { listLayersQuery } from "@/features/layers/presentation/queries/layer.query";
import { DashboardView } from "@/features/layers/presentation/components/views/dashboard-view";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Dashboard de Administración - VisorSIG",
  description: "Gestión de capas y accesos rápidos del sistema",
};

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const role = session?.user?.role as AppRole | undefined;

  // Si no es ADMIN, redirigir al mapa
  if (role !== APP_ROLES.ADMIN) {
    redirect("/mapa");
  }

  const result = await listLayersQuery();
  const layers = result.ok ? result.data : [];

  return (
    <DashboardView
      initialLayers={layers}
      hasError={!result.ok}
      errorMessage={!result.ok ? result.errors?.[0] : undefined}
    />
  );
}
