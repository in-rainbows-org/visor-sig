"use client";

import React, { useState, useMemo, useEffect } from "react";
import { ArrowLeft, ArrowRight, Check, Search, User, X } from "lucide-react";
import Image from "next/image";
import { useRouteCreationWizard } from "@/features/route-assignments/presentation/state/route-creation-wizard-store";
import type { RouteTechnician } from "@/features/route-assignments/domain/entities/route-wizard.entity";
import { techniciansCache } from "@/features/route-assignments/infrastructure/cache/technicians-cache";

export function StepTechnician() {
  const { selectedTechnician, selectTechnician, nextStep, prevStep, canAdvance } =
    useRouteCreationWizard();

  const [technicians, setTechnicians] = useState<RouteTechnician[]>(() => {
    const cached = techniciansCache.getCachedTechnicians();
    return cached
      ? cached.map((t) => ({
          id: t.id,
          name: t.name,
          email: t.email || "",
          avatarUrl: t.image || undefined,
          role: "Técnico de Campo",
        }))
      : [];
  });
  const [isLoading, setIsLoading] = useState(() => !techniciansCache.getCachedTechnicians());
  const [searchQuery, setSearchQuery] = useState("");

  // Cargar técnicos reales desde la caché compartida
  useEffect(() => {
    let isMounted = true;
    async function load() {
      if (!techniciansCache.getCachedTechnicians()) {
        setIsLoading(true);
      }
      try {
        const res = await techniciansCache.getTechnicians();
        if (res.ok && isMounted) {
          setTechnicians(
            res.data.map((t) => ({
              id: t.id,
              name: t.name,
              email: t.email || "",
              avatarUrl: t.image || undefined,
              role: "Técnico de Campo",
            }))
          );
        }
      } catch {
        // En caso de fallo de red, se mantiene la lista vacía
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredTechnicians = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return technicians;
    return technicians.filter(
      (tech) =>
        tech.name.toLowerCase().includes(q) ||
        tech.email.toLowerCase().includes(q)
    );
  }, [searchQuery, technicians]);

  return (
    <div className="flex flex-col h-full min-h-0 justify-between select-none">
      {/* 1. Título y descripción limpia */}
      <div className="px-6 pt-1 pb-2 shrink-0">
        <h3 className="text-xl font-bold text-slate-900 tracking-tight">
          Seleccionar técnico
        </h3>
        <p className="text-xs text-slate-500 leading-relaxed mt-0.5">
          Asigna al responsable operativo para esta ruta de trabajo.
        </p>
      </div>

      {/* 2. Buscador redondo reactivo */}
      <div className="px-6 pb-2.5 shrink-0">
        <div className="relative flex items-center w-full">
          <Search className="absolute left-3.5 size-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar técnico por nombre..."
            className="w-full h-10 pl-9 pr-8 rounded-full bg-slate-100/90 text-xs text-slate-800 placeholder:text-slate-400 border-0 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 text-slate-400 hover:text-slate-600 p-0.5 rounded-full cursor-pointer"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 3. Contenedor desplazable con lista de técnicos */}
      <div className="flex-1 min-h-0 overflow-y-auto px-6 py-1 space-y-2.5 scrollbar-thin scrollbar-thumb-slate-200">
        {isLoading ? (
          <div className="space-y-3 py-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 bg-slate-100 rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : technicians.length === 0 ? (
          <div className="py-10 px-4 text-center space-y-2">
            <div className="size-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <User className="size-6 text-slate-400" />
            </div>
            <p className="text-xs font-semibold text-slate-700">
              No hay técnicos registrados
            </p>
            <p className="text-[11px] text-slate-500 max-w-xs mx-auto leading-relaxed">
              Para asignar rutas de inspección, primero debes asignar el rol Técnico a usuarios del sistema en Administración de Usuarios.
            </p>
          </div>
        ) : filteredTechnicians.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No se encontraron técnicos coincidentes con &quot;{searchQuery}&quot;.
          </div>
        ) : (
          filteredTechnicians.map((tech: RouteTechnician) => {
            const isSelected = selectedTechnician?.id === tech.id;

            return (
              <div
                key={tech.id}
                onClick={() => selectTechnician(tech)}
                className={`w-full p-3 rounded-3xl transition-all cursor-pointer flex items-center justify-between border-0 shadow-none outline-none ${
                  isSelected
                    ? "bg-[#e2edff] text-blue-950"
                    : "bg-slate-100/90 hover:bg-slate-200/70 text-slate-800"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Foto / Avatar del Técnico */}
                  <div className="relative size-10 rounded-full overflow-hidden bg-slate-200 shrink-0 border-0 shadow-none">
                    {tech.avatarUrl ? (
                      <Image
                        src={tech.avatarUrl}
                        alt={tech.name}
                        fill
                        sizes="40px"
                        unoptimized
                        className="object-cover"
                      />
                    ) : (
                      <div className="size-full flex items-center justify-center text-slate-400">
                        <User className="size-5" />
                      </div>
                    )}
                  </div>

                  {/* Nombre y correo electrónico */}
                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-xs font-bold truncate ${
                        isSelected ? "text-[#0a389c]" : "text-slate-900"
                      }`}
                    >
                      {tech.name}
                    </p>
                    <p
                      className={`text-[11px] truncate font-mono ${
                        isSelected ? "text-blue-700/80 font-medium" : "text-slate-500"
                      }`}
                    >
                      {tech.email}
                    </p>
                  </div>
                </div>

                {/* Indicador de Selección Activa */}
                {isSelected && (
                  <div className="size-6 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-none animate-in zoom-in-75">
                    <Check className="size-3.5 stroke-[3]" />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* 4. Barra inferior fija con acciones (Volver y Siguiente) */}
      <div className="px-6 py-3 pb-6 sm:pb-4 flex items-center justify-between border-t border-slate-100 bg-white shrink-0">
        <button
          type="button"
          onClick={prevStep}
          className="h-11 px-5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200/80 border-0 shadow-none flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
        >
          <ArrowLeft className="size-3.5 stroke-[2.5]" />
          <span>Volver</span>
        </button>

        <button
          type="button"
          onClick={nextStep}
          disabled={!canAdvance}
          className={`h-11 px-6 rounded-full font-semibold text-xs flex items-center gap-2 transition border-0 shadow-none ${
            canAdvance
              ? "bg-gradient-to-r from-[#0e4dcb] via-[#1a66e5] to-[#2579f6] text-white hover:opacity-95 active:scale-[0.98] cursor-pointer"
              : "bg-slate-100 text-slate-400 cursor-not-allowed"
          }`}
        >
          <span>Siguiente</span>
          <ArrowRight className="size-3.5 stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
}

export default StepTechnician;
