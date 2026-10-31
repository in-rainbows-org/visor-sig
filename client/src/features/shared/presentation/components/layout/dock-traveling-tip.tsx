"use client";

import React, { useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export interface DockTravelingTipProps {
  barRef: React.RefObject<HTMLElement | null>;
  at: number | null;
  items: Array<{ key: string; label: string }>;
  orientation?: "horizontal" | "vertical";
  theme?: "dark" | "light";
}

export function DockTravelingTip({
  barRef,
  at,
  items,
  orientation = "horizontal",
  theme = "light",
}: DockTravelingTipProps) {
  const [last, setLast] = useState(0);
  const [place, setPlace] = useState<{ x?: number; y?: number; w: number } | null>(null);
  const wordRef = useRef<HTMLSpanElement>(null);
  const [ready, setReady] = useState(false);

  // Keep track of the last focused item so text remains during fade-out
  if (at !== null && at !== last && at >= 0 && at < items.length) {
    setLast(at);
  }

  useLayoutEffect(() => {
    const nav = barRef.current;
    if (!nav) return;
    const itemElements = nav.querySelectorAll<HTMLElement>(".dock-item");
    const item = itemElements[last];
    const text = wordRef.current;
    if (!item || !text) return;

    const w = Math.ceil(text.scrollWidth) + 24;

    if (orientation === "horizontal") {
      const x = item.offsetLeft + item.offsetWidth / 2 - w / 2;
      setPlace({ x, w });
    } else {
      const y = item.offsetTop + item.offsetHeight / 2 - 16; // 16px is half of 32px height
      setPlace({ y, w });
    }
  }, [last, barRef, orientation]);

  useLayoutEffect(() => {
    if (!place || ready) return;
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, [place, ready]);

  if (!items.length) return null;

  const isVisible = at !== null && at >= 0 && at < items.length && !!place;

  return (
    <span
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute h-8 inline-flex items-center justify-center overflow-hidden rounded-full whitespace-nowrap z-50 text-xs font-semibold select-none",
        orientation === "horizontal"
          ? "left-0 bottom-[calc(100%+10px)]"
          : "left-[calc(100%+14px)] top-0",
        theme === "dark"
          ? "bg-slate-900/95 text-white shadow-[0_4px_16px_rgba(0,0,0,0.22)] border border-slate-700/40"
          : "bg-white text-slate-800 border border-slate-200/80 shadow-[0_4px_16px_rgba(15,23,42,0.1)]",
        isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95",
        ready
          ? "transition-[transform,width,opacity,scale] duration-160 ease-[cubic-bezier(0.22,1,0.36,1)]"
          : "transition-opacity duration-160"
      )}
      style={
        place
          ? {
              width: place.w,
              transform:
                orientation === "horizontal"
                  ? `translateX(${place.x}px)`
                  : `translateY(${place.y}px)`,
            }
          : undefined
      }
    >
      <span ref={wordRef} className="px-3.5 truncate">
        {items[last]?.label || ""}
      </span>
    </span>
  );
}

export default DockTravelingTip;
