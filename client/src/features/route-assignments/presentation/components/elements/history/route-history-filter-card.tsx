"use client";

import React, { useState } from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar, User, Search } from "lucide-react";
import type {
  RouteHistoryFilter,
  WorkerOption,
} from "../../../../domain/entities/route-assignment-stats.entity";

export type RouteHistoryFilterCardProps = {
  filter: RouteHistoryFilter;
  workers: WorkerOption[];
  onApplyFilter: (updated: RouteHistoryFilter) => void;
  onReset: () => void;
  hasActiveFilters: boolean;
};

export function RouteHistoryFilterCard({
  filter,
  workers,
  onApplyFilter,
}: RouteHistoryFilterCardProps) {
  const [localWorkerId, setLocalWorkerId] = useState(filter.workerId || "ALL");
  const [localStartDate, setLocalStartDate] = useState(filter.startDate || "");
  const [localEndDate, setLocalEndDate] = useState(filter.endDate || "");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onApplyFilter({
      workerId: localWorkerId === "ALL" ? undefined : localWorkerId,
      startDate: localStartDate || undefined,
      endDate: localEndDate || undefined,
    });
  };

  return (
    <form
      onSubmit={handleSearch}
      className="w-full bg-white rounded-2xl sm:rounded-3xl border-0 shadow-none p-4 sm:p-5 select-none"
    >
      <div className="flex flex-col md:flex-row items-end gap-3 sm:gap-4 w-full">
        {/* 1. Selector para el técnico */}
        <div className="space-y-1.5 w-full md:flex-1 min-w-0">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1 font-label h-5 flex items-center">
            Técnico Asignado
          </label>
          <Select
            value={localWorkerId}
            onValueChange={setLocalWorkerId}
          >
            <SelectTrigger className="h-12 w-full rounded-full bg-slate-100/80 hover:bg-slate-100 border-0 text-sm font-medium text-slate-800 shadow-none focus:ring-2 focus:ring-blue-500/20 px-5 transition-colors cursor-pointer">
              <SelectValue
                placeholder={
                  <span className="flex items-center gap-2">
                    <User className="size-3.5 text-slate-400 shrink-0" />
                    <span>Todos los trabajadores</span>
                  </span>
                }
              />
            </SelectTrigger>
            <SelectContent
              position="popper"
              className="font-sans border-0 shadow-2xl shadow-slate-900/10 bg-white rounded-2xl sm:rounded-3xl p-1.5 z-50"
            >
              <SelectGroup>
                <SelectItem value="ALL">
                  <span className="flex items-center gap-2">
                    <User className="size-3.5 text-slate-400 shrink-0" />
                    <span>Todos los trabajadores</span>
                  </span>
                </SelectItem>
                {workers.map((worker) => (
                  <SelectItem key={worker.id} value={worker.id}>
                    <span className="flex items-center gap-2">
                      <User className="size-3.5 text-slate-400 shrink-0" />
                      <span>{worker.name}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        {/* 2. Fecha Desde */}
        <div className="space-y-1.5 w-full md:w-44 lg:w-52 shrink-0">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1 font-label h-5 flex items-center">
            Fecha Desde
          </label>
          <div className="relative flex items-center w-full">
            <Calendar className="absolute left-4 size-4 text-slate-400 pointer-events-none" />
            <input
              type="date"
              value={localStartDate}
              onChange={(e) => setLocalStartDate(e.target.value)}
              className="h-12 w-full rounded-full bg-slate-100/80 hover:bg-slate-100 border-0 text-sm font-medium text-slate-800 focus:bg-slate-100/95 focus:ring-2 focus:ring-blue-500/20 pl-11 pr-5 transition-colors shadow-none outline-none"
            />
          </div>
        </div>

        {/* 3. Fecha Hasta */}
        <div className="space-y-1.5 w-full md:w-44 lg:w-52 shrink-0">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1 font-label h-5 flex items-center">
            Fecha Hasta
          </label>
          <div className="relative flex items-center w-full">
            <Calendar className="absolute left-4 size-4 text-slate-400 pointer-events-none" />
            <input
              type="date"
              value={localEndDate}
              onChange={(e) => setLocalEndDate(e.target.value)}
              className="h-12 w-full rounded-full bg-slate-100/80 hover:bg-slate-100 border-0 text-sm font-medium text-slate-800 focus:bg-slate-100/95 focus:ring-2 focus:ring-blue-500/20 pl-11 pr-5 transition-colors shadow-none outline-none"
            />
          </div>
        </div>

        {/* 4. Botón de Buscar alineado a la derecha en la misma fila */}
        <div className="w-full md:w-auto shrink-0 flex items-center justify-end">
          <Button
            type="submit"
            className="h-12 w-full md:w-auto rounded-full text-xs font-semibold px-7 bg-gradient-to-r from-[#0e4dcb] via-[#1a66e5] to-[#2579f6] text-white hover:opacity-95 active:scale-[0.98] border-0 shadow-sm shadow-blue-500/20 cursor-pointer flex items-center justify-center gap-2"
          >
            <Search className="size-4" />
            <span>Buscar</span>
          </Button>
        </div>
      </div>
    </form>
  );
}
