"use client";

import { useState } from "react";
import { Globe, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type LanguageSelectorProps = {
  className?: string;
  showIcon?: boolean;
};

export function LanguageSelector({
  className,
  showIcon = true,
}: LanguageSelectorProps) {
  const [currentLang, setCurrentLang] = useState("Español");
  const [isOpen, setIsOpen] = useState(false);

  const languages = [
    { code: "es", label: "Español" },
    { code: "en", label: "English" },
    { code: "pt", label: "Português" },
  ];

  return (
    <div className={cn("relative inline-block text-left select-none", className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-900 focus:outline-none transition-colors cursor-pointer"
        aria-expanded={isOpen}
      >
        {showIcon && <Globe className="size-4 text-slate-500" />}
        <span>{currentLang}</span>
        <ChevronDown className={cn("size-3.5 text-slate-400 transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 bottom-full sm:bottom-auto sm:top-full mt-1 mb-1 z-50 min-w-[120px] rounded-2xl bg-white p-1.5 shadow-lg ring-1 ring-black/5 animate-in fade-in-0 zoom-in-95">
            {languages.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => {
                  setCurrentLang(lang.label);
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full text-left px-3 py-1.5 text-xs rounded-xl transition-colors cursor-pointer",
                  currentLang === lang.label
                    ? "bg-blue-50 text-blue-600 font-semibold"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default LanguageSelector;
