"use client";

import React, { useMemo } from "react";
import { Search, RotateCcw } from "lucide-react";
import {
  Select,
  SelectContent,
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
      className="w-full bg-card rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs space-y-4"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
        {/* Select 1: Capa */}
        <div className="space-y-1.5 w-full flex flex-col justify-start">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-1 font-label h-5 flex items-center">
            Capa a consultar
          </label>
          <Select value={layer} onValueChange={handleLayerSelect}>
            <SelectTrigger className="h-12 w-full rounded-xl bg-background border-slate-200 text-sm font-sans">
              <SelectValue placeholder="Seleccione una capa" />
            </SelectTrigger>
            <SelectContent className="font-sans">
              <SelectItem value="codigos-fijos">Códigos Fijos</SelectItem>
              <SelectItem value="lotes">Lotes</SelectItem>
              <SelectItem value="manzanas">Manzanas</SelectItem>
              <SelectItem value="vias">Vías</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Select 2: Parámetro de búsqueda */}
        <div className="space-y-1.5 w-full flex flex-col justify-start">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-1 font-label h-5 flex items-center">
            Parámetro de búsqueda
          </label>
          <Select value={searchField} onValueChange={onSearchFieldChange}>
            <SelectTrigger className="h-12 w-full rounded-xl bg-background border-slate-200 text-sm font-sans">
              <SelectValue placeholder="Seleccione un parámetro" />
            </SelectTrigger>
            <SelectContent className="font-sans">
              {availableFields.map((field) => (
                <SelectItem key={field.value} value={field.value}>
                  {field.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Input: Valor de búsqueda (usando TextFormField con rounded-xl y label unificado) */}
        <div className="w-full sm:col-span-2 lg:col-span-1 flex flex-col justify-start">
          <TextFormField
            id="consultation-search-input"
            name="searchValue"
            label="Término a buscar"
            labelClassName="h-5 flex items-center"
            inputClassName="rounded-xl"
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
      <div className="grid grid-cols-2 sm:flex sm:items-center sm:justify-end gap-2.5 pt-2 border-t border-border/60">
        <Button
          type="button"
          variant="outline"
          onClick={onReset}
          disabled={isSearching}
          className="w-full sm:w-auto rounded-xl text-xs font-medium font-sans px-4 h-10 border-slate-200 text-slate-700 hover:bg-slate-100"
        >
          <RotateCcw className="size-3.5 mr-1.5" />
          Limpiar
        </Button>

        <Button
          type="submit"
          disabled={isSearching}
          className="w-full sm:w-auto rounded-xl text-xs font-semibold font-sans px-5 h-10 bg-app-primary hover:bg-app-primary/90 text-app-primary-foreground shadow-xs"
        >
          <Search className="size-3.5 mr-1.5" />
          {isSearching ? "Buscando..." : "Buscar"}
        </Button>
      </div>
    </form>
  );
}
