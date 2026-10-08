import React from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { APP_ROLES, type AppRole } from "@/lib/auth-roles";
import { UsersView } from "@/features/users/presentation/components/elements/users-view";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Gestión de Usuarios - VisorSIG",
  description: "Administración de usuarios, roles y moderación de acceso al sistema",
};

export default async function UsuariosPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const role = session?.user?.role as AppRole | undefined;

  if (role !== APP_ROLES.ADMIN) {
    redirect("/mapa");
  }

  return <UsersView />;
}
