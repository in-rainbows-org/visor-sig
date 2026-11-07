"use client";

import React from "react";
import { PageHero } from "@/features/shared/presentation/components/layout/page-hero";
import { ActiveAssignmentCard } from "../elements/technician-portal/active-assignment-card";
import { PendingSummaryCard } from "../elements/technician-portal/pending-summary-card";
import { TechnicianStackedBars } from "../elements/technician-portal/technician-stacked-bars";
import { TechnicianAssignmentsFeed } from "../elements/technician-portal/technician-assignments-feed";
import {
  MOCK_ACTIVE_ASSIGNMENT,
  MOCK_PENDING_SUMMARY,
  MOCK_TECHNICIAN_BARS,
  MOCK_ASSIGNED_FEED,
  MOCK_COMPLETED_FEED,
} from "../../data/mock-technician-dashboard";

export function TechnicianPortalView() {
  return (
    <div className="h-full w-full lg:-ml-[32px] lg:pl-[32px] lg:w-[calc(100%+32px)] overflow-y-auto bg-slate-50/70 overscroll-contain">
      {/* 1. PageHero del Portal: con espacio superior calibrado para prevenir difuminado prematuro en scroll */}
      <PageHero
        title="Mis Asignaciones"
        description="Gestión y seguimiento de tareas"
        iconSrc="/hero-icons/mis-asignaciones.webp"
        iconAlt="Ilustración de Mis Asignaciones"
        className="pt-16 sm:pt-20 lg:pt-14 pb-8 sm:pb-10 lg:pb-7 px-6 sm:px-10 lg:px-14 rounded-b-[40px] sm:rounded-b-[48px]"
      />

      {/* Contenedor principal de secciones: optimizado para móvil primero */}
      <div className="w-full space-y-6 sm:space-y-8 p-3.5 sm:p-6 md:p-8 pb-28 lg:pb-12 max-w-7xl mx-auto">
        {/* SECCIÓN 1: Tarjetas superiores (En móvil apiladas 1x1, en desktop organizadas en cuadrícula proporcional 7:5) */}
        <section
          aria-label="Asignación activa y pendientes"
          className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-stretch"
        >
          <div className="lg:col-span-7 flex flex-col">
            <ActiveAssignmentCard
              assignment={MOCK_ACTIVE_ASSIGNMENT}
              className="h-full"
            />
          </div>
          <div className="lg:col-span-5 flex flex-col">
            <PendingSummaryCard
              summary={MOCK_PENDING_SUMMARY}
              className="h-full"
            />
          </div>
        </section>

        {/* SECCIÓN 2: Métricas de rendimiento por asignación (Stacked Bars) */}
        <section aria-label="Métricas de rendimiento por ruta">
          <TechnicianStackedBars barsData={MOCK_TECHNICIAN_BARS} />
        </section>

        {/* SECCIÓN 3: Feed de Mis Asignaciones con Switch de Asignadas vs Completadas */}
        <section aria-label="Historial y feed de asignaciones">
          <TechnicianAssignmentsFeed
            assignedItems={MOCK_ASSIGNED_FEED}
            completedItems={MOCK_COMPLETED_FEED}
          />
        </section>
      </div>
    </div>
  );
}

export default TechnicianPortalView;
