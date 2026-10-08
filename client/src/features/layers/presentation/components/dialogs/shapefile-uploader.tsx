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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      validateAndSelect(files[0]);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    onFileSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        accept=".zip,application/zip"
        onChange={handleFileChange}
        disabled={disabled}
        className="hidden"
        id="shapefile-upload-input"
      />

      <div
        onClick={() => !disabled && fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          "relative flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-2xl transition-all cursor-pointer select-none",
          disabled && "opacity-50 cursor-not-allowed",
          isDragging
            ? "border-blue-500 bg-blue-50/50"
            : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 bg-slate-50/30"
        )}
      >
        {selectedFile ? (
          <div className="flex items-center gap-3 w-full bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
              <FileArchive className="w-5 h-5" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-800 truncate">
                {selectedFile.name}
              </p>
              <p className="text-[11px] text-slate-400">
                {formatSize(selectedFile.size)}
              </p>
            </div>

            {!disabled && (
              <button
                type="button"
                onClick={handleRemove}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                title="Quitar archivo"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-2xs">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-700">
                Arrastra tu archivo .zip aquí o{" "}
                <span className="text-blue-600 underline">haz clic para explorar</span>
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Debe contener archivos Shapefile (.shp, .shx, .dbf, .prj). Máximo 100 MB.
              </p>
            </div>
          </div>
        )}
      </div>

      {clientError && (
        <div className="flex items-center gap-1.5 text-xs text-rose-600 font-medium px-1">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{clientError}</span>
        </div>
      )}
    </div>
  );
}

export default ShapefileUploader;
