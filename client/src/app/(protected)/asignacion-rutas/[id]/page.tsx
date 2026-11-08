import React from "react";
import { AssignmentDetailView } from "@/features/route-assignments/presentation/components/views/assignment-detail-view";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Detalle de Asignación - VisorSIG",
  description: "Monitoreo y trazabilidad detallada de rutas y visitas técnicas",
};

type AssignmentDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AssignmentDetailPage({ params }: AssignmentDetailPageProps) {
  const { id } = await params;

  return <AssignmentDetailView assignmentId={id} />;
}
