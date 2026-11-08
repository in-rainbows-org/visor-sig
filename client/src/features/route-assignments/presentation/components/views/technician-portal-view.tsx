"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { PageHero } from "@/features/shared/presentation/components/layout/page-hero";
import { ActiveAssignmentCard } from "../elements/technician-portal/active-assignment-card";
import { PendingSummaryCard } from "../elements/technician-portal/pending-summary-card";
import { TechnicianStackedBars } from "../elements/technician-portal/technician-stacked-bars";
import { TechnicianAssignmentsFeed } from "../elements/technician-portal/technician-assignments-feed";
import { TechnicianPortalSkeleton } from "../elements/technician-portal/technician-portal-skeleton";
import { MOCK_TECHNICIAN_BARS } from "../../data/mock-technician-dashboard";
import { useTechnicianPortal } from "../../hooks/use-technician-portal";

export function TechnicianPortalView() {
  const router = useRouter();
  const {
    activeAssignment,
    pendingSummary,
    assignedFeed,
    completedFeed,
    isLoading,
  } = useTechnicianPortal();

  return (
    <div className="h-full w-full lg:-ml-[32px] lg:pl-[32px] lg:w-[calc(100%+32px)] overflow-y-auto bg-slate-50/70 overscroll-contain">
      {/* 1. PageHero del Portal */}
      <PageHero
        title="Mis Asignaciones"
        description="Gestión y seguimiento de tareas"
        iconSrc="/hero-icons/mis-asignaciones.webp"
        iconAlt="Ilustración de Mis Asignaciones"
        className="pt-16 sm:pt-20 lg:pt-14 pb-8 sm:pb-10 lg:pb-7 px-6 sm:px-10 lg:px-14 rounded-b-[40px] sm:rounded-b-[48px]"
      />

      {/* Contenedor principal de secciones */}
      <div className="w-full space-y-6 sm:space-y-8 p-3.5 sm:p-6 md:p-8 pb-28 lg:pb-12 max-w-7xl mx-auto">
        {isLoading ? (
          <TechnicianPortalSkeleton />
        ) : (
          <>
            {/* SECCIÓN 1: Asignación activa en progreso (si existe) */}
            {activeAssignment && (
              <section aria-label="Asignación activa en progreso">
                <ActiveAssignmentCard
                  assignment={activeAssignment}
                  onNavigate={(id) => router.push(`/mis-asignaciones/${id}`)}
                />
              </section>
            )}

            {/* SECCIÓN 2: Asignaciones pendientes y Rendimiento (En móvil/tablet en 2 filas, en escritorio en 1 fila de 2 columnas) */}
            <section
              aria-label="Resumen de pendientes y rendimiento"
              className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 items-stretch"
            >
              <div className="flex flex-col h-full">
                <PendingSummaryCard
                  summary={pendingSummary}
                  className="h-full"
                />
              </div>
              <div className="flex flex-col h-full">
                <TechnicianStackedBars
                  barsData={MOCK_TECHNICIAN_BARS}
                  className="h-full"
                />
              </div>
            </section>

            {/* SECCIÓN 3: Feed de Mis Asignaciones con Switch de Asignadas vs Completadas */}
            <section aria-label="Historial y feed de asignaciones">
              <TechnicianAssignmentsFeed
                assignedItems={assignedFeed}
                completedItems={completedFeed}
                onSelectAssignment={(item) => router.push(`/mis-asignaciones/${item.id}`)}
              />
            </section>
          </>
        )}
      </div>
    </div>
  );
}

export default TechnicianPortalView;
