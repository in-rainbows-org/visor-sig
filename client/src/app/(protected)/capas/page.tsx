import React from "react";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { APP_ROLES, type AppRole } from "@/lib/auth-roles";
import { listLayersQuery } from "@/features/layers/presentation/queries/list-layers.query";
import { LayerCatalogView } from "@/features/layers/presentation/components/layer-catalog-view";
import { RestrictedAccessBanner } from "@/features/layers/presentation/components/restricted-access-banner";

export const dynamic = "force-dynamic";

export default async function CapasPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const role = session?.user?.role as AppRole | undefined;

  // Si no es ADMIN, mostrar pantalla amigable de restricción
  if (role !== APP_ROLES.ADMIN) {
    return <RestrictedAccessBanner />;
  }

  const result = await listLayersQuery();
  const layers = result.ok ? result.data : [];

  return (
    <LayerCatalogView
      initialLayers={layers}
      hasError={!result.ok}
      errorMessage={!result.ok ? result.errors?.[0] : undefined}
    />
  );
}
