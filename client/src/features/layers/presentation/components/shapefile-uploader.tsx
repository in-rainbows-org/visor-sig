"use client";

import React, { useRef, useState } from "react";
import { UploadCloud, FileArchive, X, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type ShapefileUploaderProps = {
  onFileSelect: (file: File | null) => void;
  selectedFile: File | null;
  disabled?: boolean;
};

const MAX_FILE_SIZE_BYTES = 104857600; // 100 MB

export function ShapefileUploader({
  onFileSelect,
  selectedFile,
  disabled = false,
}: ShapefileUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);

  const validateAndSelect = (file: File) => {
    setClientError(null);

    if (!file.name.toLowerCase().endsWith(".zip")) {
      setClientError("Solo se permiten archivos comprimidos en formato .zip.");
      onFileSelect(null);
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setClientError("El archivo supera el límite máximo permitido de 100 MB.");
      onFileSelect(null);
      return;
    }

    onFileSelect(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      validateAndSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      validateAndSelect(files[0]);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFileSelect(null);
    setClientError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept=".zip,application/zip,application/x-zip-compressed"
        onChange={handleInputChange}
        disabled={disabled}
        className="hidden"
      />

      {/* Zona de Drop / Clic */}
      <div
        onClick={() => !disabled && fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          "border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer select-none",
          isDragging
            ? "border-blue-500 bg-blue-50/50"
            : "border-slate-300 hover:border-blue-400 bg-slate-50/50 hover:bg-slate-50",
          disabled && "cursor-not-allowed opacity-60"
        )}
      >
        <div className="flex flex-col items-center justify-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-xs">
            <UploadCloud className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">
              Haz clic para seleccionar o arrastra el archivo ZIP
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              Debe contener los componentes (.shp, .shx, .dbf, .prj) · Máx 100 MB
            </p>
          </div>
        </div>
      </div>

      {/* Archivo seleccionado */}
      {selectedFile && (
        <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
              <FileArchive className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-800 truncate">
                {selectedFile.name}
              </p>
              <p className="text-[11px] text-slate-400">
                {formatFileSize(selectedFile.size)}
              </p>
            </div>
          </div>
          {!disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              title="Quitar archivo"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Error de validación local */}
      {clientError && (
        <div className="flex items-center gap-2 p-3 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{clientError}</span>
        </div>
      )}
    </div>
  );
}

export default ShapefileUploader;
