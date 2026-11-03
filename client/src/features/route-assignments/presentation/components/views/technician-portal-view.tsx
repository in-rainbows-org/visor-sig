"use client";

import React from "react";
import { PageHero } from "@/features/shared/presentation/components/layout/page-hero";
import { Button } from "@/components/ui/button";
import { AlertCircle, ClipboardList, RotateCcw } from "lucide-react";
import { useTechnicianPortal } from "../../hooks/use-technician-portal";
import { TechnicianAssignmentCard } from "../elements/technician-portal/technician-assignment-card";

export function TechnicianPortalView() {
  const { user, assignments, isLoading, error, refetch } = useTechnicianPortal();

  return (
    <div className="h-full w-full lg:-ml-[32px] lg:pl-[32px] lg:w-[calc(100%+32px)] overflow-y-auto bg-slate-50/70 overscroll-contain">
      {/* 1. PageHero del Portal */}
      <PageHero
        title="Mis Asignaciones"
        description="Revisa y gestiona las rutas asignadas a tu jornada operativa"
        iconSrc="/hero-icons/mis-asignaciones.webp"
        iconAlt="Ilustración de Mis Asignaciones"
      />

      <div className="w-full space-y-6 sm:space-y-8 p-4 sm:p-6 md:p-8 pb-24 lg:pb-8 max-w-7xl mx-auto">
        {/* Cabecera de la sección */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Rutas Programadas
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {isLoading
                ? "Consultando tus rutas asignadas..."
                : assignments.length === 1
                ? "1 ruta asignada a tu cuenta"
                : `${assignments.length} rutas asignadas a tu cuenta`}
            </p>
          </div>
        </div>

        {/* Estado de Error */}
        {error && !isLoading && (
          <div className="rounded-2xl sm:rounded-3xl border border-rose-200 bg-rose-50/70 p-6 sm:p-8 text-center space-y-3">
            <div className="size-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle className="size-6" />
            </div>
            <h4 className="text-base font-semibold text-rose-900">
              Error al consultar asignaciones
            </h4>
            <p className="text-xs text-rose-700 max-w-md mx-auto">
              {error}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={refetch}
              className="rounded-full text-xs font-semibold gap-1.5 mt-2 bg-white text-rose-700 border-rose-200 hover:bg-rose-100/50 cursor-pointer"
            >
              <RotateCcw className="size-3.5" />
              <span>Reintentar carga</span>
            </Button>
          </div>
        )}

        {/* Loading Skeletons */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-2xl sm:rounded-3xl bg-white p-5 sm:p-6 border-0 shadow-none space-y-4 animate-pulse"
              >
                <div className="flex justify-between items-center">
                  <div className="h-5 bg-slate-200 rounded-full w-28" />
                  <div className="h-6 bg-slate-100 rounded-full w-20" />
                </div>
                <div className="h-px bg-slate-100" />
                <div className="flex justify-between items-center pt-1">
                  <div className="h-7 bg-slate-100 rounded-full w-32" />
                  <div className="h-4 bg-slate-100 rounded-full w-24" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Estado Vacío */}
        {!isLoading && !error && assignments.length === 0 && (
          <div className="rounded-2xl sm:rounded-3xl border border-dashed border-slate-200 bg-white/80 p-12 text-center space-y-3">
            <div className="size-14 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <ClipboardList className="size-7" />
            </div>
            <h4 className="text-base font-bold text-slate-800">
              No tienes rutas asignadas actualmente
            </h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              No existen órdenes de corte o reconexión programadas para tu usuario en este momento. Consulta con tu supervisor de operaciones para nuevas rutas.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={refetch}
              className="rounded-full text-xs font-semibold gap-1.5 mt-2 bg-slate-50 hover:bg-slate-100 border-0 shadow-none text-slate-700 cursor-pointer"
            >
              <RotateCcw className="size-3.5" />
              <span>Actualizar lista</span>
            </Button>
          </div>
        )}

        {/* Listado de Tarjetas de Asignación */}
        {!isLoading && !error && assignments.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assignments.map((assignment) => (
              <TechnicianAssignmentCard
                key={assignment.id}
                assignment={assignment}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default TechnicianPortalView;
