import React from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { APP_ROLES, type AppRole } from "@/lib/auth-roles";
import { TechnicianPortalView } from "@/features/route-assignments/presentation/components/views/technician-portal-view";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Mis Asignaciones - VisorSIG",
  description: "Portal de trabajo y rutas asignadas para personal técnico y de campo",
};

export default async function MisAsignacionesPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const role = session?.user?.role as AppRole | undefined;

  if (role !== APP_ROLES.TECHNICIAN) {
    redirect(role === APP_ROLES.ADMIN ? "/dashboard" : "/mapa");
  }

  return <TechnicianPortalView />;
}
