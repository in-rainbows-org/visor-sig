import React from "react";
import { TechnicianAssignmentDetailView } from "@/features/route-assignments/presentation/components/views/technician-assignment-detail-view";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Detalle de Mi Asignación - VisorSIG",
  description: "Monitoreo y trazabilidad móvil de rutas y visitas de campo",
};

type TechnicianAssignmentDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function TechnicianAssignmentDetailPage({
  params,
}: TechnicianAssignmentDetailPageProps) {
  const { id } = await params;

  return <TechnicianAssignmentDetailView assignmentId={id} />;
}
