import React from "react";
import { RouteAssignmentsView } from "@/features/route-assignments/presentation/components/views/route-assignments-view";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Asignación de Rutas - VisorSIG",
  description: "Monitoreo operativo, estadísticas y asignación de rutas de inspección territorial",
};

export default function AsignacionRutasPage() {
  return <RouteAssignmentsView />;
}
