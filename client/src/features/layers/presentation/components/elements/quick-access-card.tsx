"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export type QuickAccessItem = {
  key: string;
  title: string;
  description: string;
  href: string;
  iconSrc: string;
};

export type QuickAccessCardProps = {
  item: QuickAccessItem;
  className?: string;
};

function truncateWords(text: string, count: number = 3): string {
  if (!text) return "";
  const words = text.trim().split(/\s+/);
  if (words.length <= count) return text;
  return `${words.slice(0, count).join(" ").replace(/[,;.:]+$/, "")}...`;
}

export function QuickAccessCard({ item, className }: QuickAccessCardProps) {
  const shortDescription = truncateWords(item.description, 3);

  return (
    <Link
      href={item.href}
      className={cn(
        "rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs hover:shadow-md hover:-translate-y-1 hover:border-blue-200 transition-all duration-200 flex flex-col items-center justify-between text-center group cursor-pointer select-none h-full min-h-[135px] sm:min-h-[145px] lg:min-h-[160px]",
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

      <div className="w-full space-y-0.5 mt-2">
        <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors tracking-tight">
          {item.title}
        </h4>

        <p className="text-xs text-slate-500 font-sans leading-relaxed">
          {shortDescription}
        </p>
      </div>
    </Link>
  );
}

export default QuickAccessCard;
