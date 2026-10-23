"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export type QuickAccessItem = {
  key: string;
  title: string;
  description?: string;
  href: string;
  iconSrc: string;
};

export type QuickAccessCardProps = {
  item: QuickAccessItem;
  className?: string;
};

export function QuickAccessCard({ item, className }: QuickAccessCardProps) {
  return (
    <Link
      href={item.href}
      className={cn(
        "rounded-[24px] sm:rounded-[28px] border-0 shadow-none bg-white p-4 sm:p-5 flex flex-col items-center justify-center text-center group cursor-pointer select-none h-full min-h-[125px] sm:min-h-[140px] hover:bg-white/90 hover:scale-[1.02] active:scale-[0.97] transition-all duration-200",
        className
      )}
    >
      <div className="relative w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 transition-transform duration-300 group-hover:scale-110 flex-shrink-0">
        <Image
          src={item.iconSrc}
          alt={item.title}
          fill
          sizes="(max-width: 640px) 48px, (max-width: 1024px) 56px, 64px"
          className="object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.06)]"
        />
      </div>

      <h4 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors tracking-tight mt-2.5 sm:mt-3">
        {item.title}
      </h4>
    </Link>
  );
}

export default QuickAccessCard;
