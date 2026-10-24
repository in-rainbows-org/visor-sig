"use client";

import React, { useMemo } from "react";
import { Search, RotateCcw } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import TextFormField from "@/features/shared/presentation/components/forms/text-form-field";
import type { ConsultationLayerKind } from "../../../domain/entities/consultation.entity";

export type SearchFieldOption = {
  value: string;
  label: string;
};

export const LAYER_OPTIONS: { value: ConsultationLayerKind; label: string }[] = [
  { value: "codigos-fijos", label: "Códigos Fijos" },
  { value: "lotes", label: "Lotes" },
  { value: "manzanas", label: "Manzanas" },
  { value: "vias", label: "Vías" },
];

export const LAYER_SEARCH_FIELDS: Record<ConsultationLayerKind, SearchFieldOption[]> = {
  "codigos-fijos": [
    { value: "fixed_code", label: "Código Fijo" },
    { value: "name", label: "Nombre / Titular" },
  ],
  lotes: [
    { value: "lot_number", label: "Número de Lote" },
  ],
  manzanas: [
    { value: "uv_block_code", label: "Código UV-Manzana" },
    { value: "uv", label: "Unidad Vecinal" },
    { value: "block_number", label: "Número de Manzana" },
  ],
  vias: [
    { value: "road_type", label: "Tipo de Vía" },
    { value: "name", label: "Nombre de Vía" },
  ],
};

export type ConsultationSearchFormProps = {
  layer: ConsultationLayerKind;
  onLayerChange: (layer: ConsultationLayerKind) => void;
  searchField: string;
  onSearchFieldChange: (field: string) => void;
  searchValue: string;
  onSearchValueChange: (value: string) => void;
  onSearch: (e: React.FormEvent) => void;
  onReset: () => void;
  isSearching: boolean;
};

export function ConsultationSearchForm({
  layer,
  onLayerChange,
  searchField,
  onSearchFieldChange,
  searchValue,
  onSearchValueChange,
  onSearch,
  onReset,
  isSearching,
}: ConsultationSearchFormProps) {
  const availableFields = useMemo(() => LAYER_SEARCH_FIELDS[layer] || [], [layer]);

  const handleLayerSelect = (newLayer: string) => {
    const validLayer = newLayer as ConsultationLayerKind;
    onLayerChange(validLayer);
    const fields = LAYER_SEARCH_FIELDS[validLayer];
    if (fields && fields.length > 0) {
      onSearchFieldChange(fields[0].value);
    }
  };

  return (
    <form
      onSubmit={onSearch}
      className="w-full bg-white rounded-2xl sm:rounded-3xl border-0 shadow-none p-5 sm:p-6 space-y-4 select-none"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
        {/* Select 1: Capa */}
        <div className="space-y-1.5 w-full flex flex-col justify-start">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1 font-label h-5 flex items-center">
            Capa a consultar
          </label>
          <Select value={layer} onValueChange={handleLayerSelect}>
            <SelectTrigger className="h-12 w-full rounded-full bg-slate-100/80 hover:bg-slate-100 border-0 text-sm font-medium text-slate-800 shadow-none focus:ring-2 focus:ring-blue-500/20 px-5 transition-colors cursor-pointer">
              <SelectValue placeholder="Seleccione una capa" />
            </SelectTrigger>
            <SelectContent
              position="item-aligned"
              className="font-sans border-0 shadow-2xl shadow-slate-900/10 bg-white rounded-2xl sm:rounded-3xl p-1.5"
            >
              <SelectGroup>
                {LAYER_OPTIONS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        {/* Select 2: Parámetro de búsqueda */}
        <div className="space-y-1.5 w-full flex flex-col justify-start">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1 font-label h-5 flex items-center">
            Parámetro de búsqueda
          </label>
          <Select value={searchField} onValueChange={onSearchFieldChange}>
            <SelectTrigger className="h-12 w-full rounded-full bg-slate-100/80 hover:bg-slate-100 border-0 text-sm font-medium text-slate-800 shadow-none focus:ring-2 focus:ring-blue-500/20 px-5 transition-colors cursor-pointer">
              <SelectValue placeholder="Seleccione un parámetro" />
            </SelectTrigger>
            <SelectContent
              position="item-aligned"
              className="font-sans border-0 shadow-2xl shadow-slate-900/10 bg-white rounded-2xl sm:rounded-3xl p-1.5"
            >
              <SelectGroup>
                {availableFields.map((field) => (
                  <SelectItem key={field.value} value={field.value}>
                    {field.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        {/* Input: Valor de búsqueda (homogéneo con los selects en color y redondez tipo píldora) */}
        <div className="w-full sm:col-span-2 lg:col-span-1 flex flex-col justify-start">
          <TextFormField
            id="consultation-search-input"
            name="searchValue"
            label="Término a buscar"
            labelClassName="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1 font-label h-5 flex items-center"
            inputClassName="h-12 rounded-full bg-slate-100/80 hover:bg-slate-100 border-0 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:bg-slate-100/95 focus:ring-2 focus:ring-blue-500/20 px-5 transition-colors shadow-none"
            placeholder="Ingrese el valor a buscar..."
            type="text"
            required={false}
            value={searchValue}
            onChange={(e) => onSearchValueChange(e.target.value)}
            className="w-full"
          />
        </div>
      </div>

      {/* Botones de acción */}
      <div className="grid grid-cols-2 sm:flex sm:items-center sm:justify-end gap-2.5 pt-2 border-t border-slate-100">
        <Button
          type="button"
          variant="outline"
          onClick={onReset}
          disabled={isSearching}
          className="w-full sm:w-auto rounded-full text-xs font-medium font-sans px-4 h-10 border-0 bg-slate-100/80 text-slate-700 hover:bg-slate-200/80 shadow-none transition-colors cursor-pointer"
        >
          <RotateCcw className="size-3.5 mr-1.5" />
          Limpiar
        </Button>

        <Button
          type="submit"
          disabled={isSearching}
          className="w-full sm:w-auto rounded-full text-xs font-semibold font-sans px-5 h-10 bg-gradient-to-r from-[#0e4dcb] via-[#1a66e5] to-[#2579f6] text-white hover:opacity-95 active:scale-[0.98] border-0 shadow-none cursor-pointer"
        >
          <Search className="size-3.5 mr-1.5" />
          {isSearching ? "Buscando..." : "Buscar"}
        </Button>
      </div>
    </form>
  );
}
