"use client";

import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, RotateCcw, Shield, CheckCircle2 } from "lucide-react";
import { APP_ROLES } from "@/lib/auth-roles";
import type { RoleFilter, StatusFilter } from "../../hooks/use-users";

export interface UsersSearchFormProps {
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  roleFilter: RoleFilter;
  onRoleFilterChange: (role: RoleFilter) => void;
  statusFilter: StatusFilter;
  onStatusFilterChange: (status: StatusFilter) => void;
  hasActiveFilters: boolean;
  onResetFilters: () => void;
}

export function UsersSearchForm({
  searchQuery,
  onSearchQueryChange,
  roleFilter,
  onRoleFilterChange,
  statusFilter,
  onStatusFilterChange,
  hasActiveFilters,
  onResetFilters,
}: UsersSearchFormProps) {
  return (
    <div className="w-full bg-white rounded-2xl sm:rounded-3xl border-0 shadow-none p-5 sm:p-6 space-y-4 select-none">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
        {/* Campo 1: Término de búsqueda */}
        <div className="space-y-1.5 w-full flex flex-col justify-start">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1 font-label h-5 flex items-center">
            Buscar usuario
          </label>
          <div className="relative flex items-center w-full">
            <Search className="absolute left-4 size-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              placeholder="Buscar por nombre o correo..."
              className="h-12 w-full rounded-full bg-slate-100/80 hover:bg-slate-100 border-0 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:bg-slate-100/95 focus:ring-2 focus:ring-blue-500/20 pl-11 pr-5 transition-colors shadow-none outline-none"
            />
          </div>
        </div>

        {/* Campo 2: Filtro por Rol */}
        <div className="space-y-1.5 w-full flex flex-col justify-start">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1 font-label h-5 flex items-center">
            Rol de acceso
          </label>
          <Select
            value={roleFilter}
            onValueChange={(val) => onRoleFilterChange(val as RoleFilter)}
          >
            <SelectTrigger className="h-12 w-full rounded-full bg-slate-100/80 hover:bg-slate-100 border-0 text-sm font-medium text-slate-800 shadow-none focus:ring-2 focus:ring-blue-500/20 px-5 transition-colors cursor-pointer">
              <div className="flex items-center gap-2 truncate">
                <Shield className="size-3.5 text-slate-400 shrink-0" />
                <SelectValue placeholder="Rol: Todos" />
              </div>
            </SelectTrigger>
            <SelectContent className="font-sans border-0 shadow-2xl shadow-slate-900/10 bg-white rounded-2xl sm:rounded-3xl p-2 space-y-1">
              <SelectItem value="ALL">Todos los roles</SelectItem>
              <SelectItem value={APP_ROLES.ADMIN}>Administradores</SelectItem>
              <SelectItem value={APP_ROLES.CONSULTANT}>Consultores</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Campo 3: Filtro por Estado */}
        <div className="space-y-1.5 w-full flex flex-col justify-start">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1 font-label h-5 flex items-center">
            Estado de cuenta
          </label>
          <Select
            value={statusFilter}
            onValueChange={(val) => onStatusFilterChange(val as StatusFilter)}
          >
            <SelectTrigger className="h-12 w-full rounded-full bg-slate-100/80 hover:bg-slate-100 border-0 text-sm font-medium text-slate-800 shadow-none focus:ring-2 focus:ring-blue-500/20 px-5 transition-colors cursor-pointer">
              <div className="flex items-center gap-2 truncate">
                <CheckCircle2 className="size-3.5 text-slate-400 shrink-0" />
                <SelectValue placeholder="Estado: Todos" />
              </div>
            </SelectTrigger>
            <SelectContent className="font-sans border-0 shadow-2xl shadow-slate-900/10 bg-white rounded-2xl sm:rounded-3xl p-2 space-y-1">
              <SelectItem value="ALL">Todos los estados</SelectItem>
              <SelectItem value="ACTIVE">Activos</SelectItem>
              <SelectItem value="BANNED">Bloqueados</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Botones de acción */}
      {hasActiveFilters && (
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            onClick={onResetFilters}
            className="w-full sm:w-auto rounded-full text-xs font-medium font-sans px-4 h-10 border-0 bg-slate-100/80 text-slate-700 hover:bg-slate-200/80 shadow-none transition-colors cursor-pointer"
          >
            <RotateCcw className="size-3.5 mr-1.5" />
            Limpiar filtros
          </Button>
        </div>
      )}
    </div>
  );
}
