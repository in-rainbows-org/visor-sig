"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface ConsultationPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export function ConsultationPagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
}: ConsultationPaginationProps) {
  if (totalItems === 0) return null;

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Generar lista de números de páginas visibles
  const getPageNumbers = () => {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    const end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="px-5 py-3.5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 bg-white">
      <span className="font-medium">
        Mostrando {startItem} a {endItem} de {totalItems} {totalItems === 1 ? "resultado" : "resultados"}
      </span>

      <div className="flex items-center space-x-1.5 select-none">
        {/* Botón Página Anterior */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          aria-label="Página anterior"
          className="w-7 h-7 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-colors shadow-xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        {/* Números de página */}
        {pageNumbers.map((p) => {
          const isActive = p === currentPage;
          return (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              className={`w-7 h-7 rounded-lg text-xs font-medium flex items-center justify-center shadow-xs transition-colors cursor-pointer ${
                isActive
                  ? "bg-blue-600 text-white"
                  : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              {p}
            </button>
          );
        })}

        {/* Botón Página Siguiente */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          aria-label="Página siguiente"
          className="w-7 h-7 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-colors shadow-xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
