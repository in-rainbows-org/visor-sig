import React from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { APP_ROLES, type AppRole } from "@/lib/auth-roles";
import { AuditLogsView } from "@/features/audit-logs/presentation/components/elements/audit-logs-view";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Bitácora del Sistema - VisorSIG",
  description: "Registro cronológico e inmutable de actividades y eventos operativos del visor geoespacial",
};

export default async function BitacoraPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const role = session?.user?.role as AppRole | undefined;

  if (role !== APP_ROLES.ADMIN) {
    redirect("/mapa");
  }

  return <AuditLogsView />;
}
