import React from "react";
import { RouteCreationView } from "@/features/route-assignments/presentation/components/views/route-creation-view";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Nueva Asignación - VisorSIG",
  description: "Planificación territorial y asignación de códigos fijos para rutas de campo",
};

export default function NuevaAsignacionPage() {
  return <RouteCreationView />;
}
