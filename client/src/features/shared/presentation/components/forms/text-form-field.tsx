"use client";

import { ComponentProps, ReactNode, useState } from "react";
import { cn } from "@/lib/utils";
import { Eye, EyeOff } from "lucide-react";

export type TextFormFieldProps = {
  id: string;
  name: string;
  placeholder?: string;
  label?: string;
  type?: "text" | "email" | "password" | string;
  icon?: ReactNode;
  autoComplete?: string;
  required?: boolean;
  error?: string;
  className?: string;
} & Omit<ComponentProps<"input">, "type">;

export function TextFormField({
  id,
  name,
  placeholder,
  label,
  type = "text",
  icon,
  autoComplete,
  required = true,
  error,
  className,
  ...props
}: TextFormFieldProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const actualType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <div className={cn("w-full flex flex-col gap-1.5", className)}>
      {label && (
        <label
          htmlFor={id}
          className="text-xs font-medium text-slate-600 tracking-wide pl-1 select-none"
        >
          {label}
        </label>
      )}
      <div className="relative flex items-center w-full">
        {icon && (
          <div className="absolute left-4 pointer-events-none text-slate-400 flex items-center justify-center z-10">
            {icon}
          </div>
        )}
        <input
          id={id}
          name={name}
          type={actualType}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          className={cn(
            "w-full h-12 rounded-full border border-slate-200 bg-white text-sm text-slate-800 placeholder:text-slate-400 transition-all",
            "focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 hover:border-slate-300",
            icon ? "pl-11" : "pl-5",
            isPassword ? "pr-11" : "pr-5",
            error && "border-red-400 focus:border-red-500 focus:ring-red-500/10"
          )}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3.5 p-1 rounded-full text-slate-400 hover:text-slate-600 focus:outline-none focus:text-blue-600 transition-colors cursor-pointer z-10"
            tabIndex={-1}
            aria-label={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
          >
            {showPassword ? (
              <EyeOff className="size-4 text-slate-400" />
            ) : (
              <Eye className="size-4 text-slate-400" />
            )}
          </button>
        )}
      </div>
      {error && <span className="text-xs text-red-500 pl-3">{error}</span>}
    </div>
  );
}

export default TextFormField;

