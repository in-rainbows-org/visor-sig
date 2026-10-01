"use client";

import React from "react";
import { Search, RotateCcw, ChevronDown, Layers as LayersIcon } from "lucide-react";
import { FieldOption, LayerOption } from "../../domain/models/consultation";

export interface ConsultationFiltersProps {
  layers: LayerOption[];
  fields: FieldOption[];
  selectedLayerKind: string;
  selectedField: string;
  searchValue: string;
  isSearching: boolean;
  onLayerChange: (kind: string) => void;
  onFieldChange: (field: string) => void;
  onValueChange: (value: string) => void;
  onSearch: () => void;
  onReset: () => void;
}

export function ConsultationFilters({
  layers,
  fields,
  selectedLayerKind,
  selectedField,
  searchValue,
  isSearching,
  onLayerChange,
  onFieldChange,
  onValueChange,
  onSearch,
  onReset,
}: ConsultationFiltersProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onSearch();
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 mb-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
      {/* Header del bloque de filtros */}
      <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm mb-4">
        <Search className="w-4 h-4 text-blue-600" />
        <span>Consulta alfanumérica</span>
      </div>

      {/* Grid de controles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3.5 items-end">
        {/* Selector de Capa */}
        <div className="md:col-span-3">
          <label className="block text-xs font-medium text-slate-600 mb-1.5">
            Capa
          </label>
          <div className="relative">
            <select
              value={selectedLayerKind}
              onChange={(e) => onLayerChange(e.target.value)}
              className="w-full appearance-none bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 cursor-pointer hover:border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-xs font-medium pr-8"
            >
              {layers.map((l) => (
                <option key={l.kind} value={l.kind}>
                  {l.name} {!l.hasActiveVersion ? "(Sin datos activos)" : ""}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Selector de Campo */}
        <div className="md:col-span-3">
          <label className="block text-xs font-medium text-slate-600 mb-1.5">
            Campo
          </label>
          <div className="relative">
            <select
              value={selectedField}
              onChange={(e) => onFieldChange(e.target.value)}
              className="w-full appearance-none bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 cursor-pointer hover:border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-xs font-medium pr-8"
              disabled={fields.length === 0}
            >
              {fields.length === 0 ? (
                <option value="">Todos los campos</option>
              ) : (
                fields.map((f) => (
                  <option key={f.key} value={f.key}>
                    {f.label}
                  </option>
                ))
              )}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Input de Valor */}
        <div className="md:col-span-3">
          <label className="block text-xs font-medium text-slate-600 mb-1.5">
            Valor
          </label>
          <input
            type="text"
            placeholder="Ej. 001-025..."
            value={searchValue}
            onChange={(e) => onValueChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 hover:border-slate-300 shadow-xs font-medium h-[34px]"
          />
        </div>

        {/* Botones de Acción: Buscar & Limpiar */}
        <div className="md:col-span-3 flex items-center gap-2">
          <button
            type="button"
            onClick={onSearch}
            disabled={isSearching}
            className="flex-1 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium text-xs rounded-xl px-4 py-2 flex items-center justify-center space-x-2 transition-all shadow-xs cursor-pointer h-[34px] disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <Search className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>{isSearching ? "Buscando..." : "Buscar"}</span>
          </button>

          <button
            type="button"
            onClick={onReset}
            title="Limpiar filtros"
            className="w-9 h-[34px] bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-600 rounded-xl flex items-center justify-center transition-colors shadow-xs cursor-pointer shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
