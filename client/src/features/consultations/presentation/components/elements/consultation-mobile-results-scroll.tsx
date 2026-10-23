"use client";

import React, { useState, useEffect, useMemo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface ConsultationMobileResultsScrollProps {
  children: React.ReactNode;
  itemCount: number;
}

export function ConsultationMobileResultsScroll({
  children,
  itemCount,
}: ConsultationMobileResultsScrollProps) {
  const [scrollFade, setScrollFade] = useState<{
    canScrollUp: boolean;
    canScrollDown: boolean;
  }>({
    canScrollUp: false,
    canScrollDown: itemCount > 3,
  });

  const handleMobileCardsScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const canScrollUp = el.scrollTop > 8;
    const canScrollDown = el.scrollTop + el.clientHeight < el.scrollHeight - 8;
    setScrollFade((prev) => {
      if (prev.canScrollUp === canScrollUp && prev.canScrollDown === canScrollDown) {
        return prev;
      }
      return { canScrollUp, canScrollDown };
    });
  };

  useEffect(() => {
    const canScrollDown = itemCount > 3;
    setScrollFade((prev) => {
      if (prev.canScrollUp === false && prev.canScrollDown === canScrollDown) {
        return prev;
      }
      return { canScrollUp: false, canScrollDown };
    });
  }, [itemCount]);

  const mobileMaskStyle = useMemo<React.CSSProperties>(() => {
    const { canScrollUp, canScrollDown } = scrollFade;
    const fade = "28px";
    if (canScrollUp && canScrollDown) {
      const gradient = `linear-gradient(to bottom, transparent 0%, black ${fade}, black calc(100% - ${fade}), transparent 100%)`;
      return {
        maskImage: gradient,
        WebkitMaskImage: gradient,
      };
    }
    if (canScrollUp) {
      const gradient = `linear-gradient(to bottom, transparent 0%, black ${fade}, black 100%)`;
      return {
        maskImage: gradient,
        WebkitMaskImage: gradient,
      };
    }
    if (canScrollDown) {
      const gradient = `linear-gradient(to bottom, black 0%, black calc(100% - ${fade}), transparent 100%)`;
      return {
        maskImage: gradient,
        WebkitMaskImage: gradient,
      };
    }
    return {};
  }, [scrollFade]);

  return (
    <div className="block lg:hidden w-full">
      <ScrollArea
        className="h-[580px] max-h-[calc(100dvh-12rem)] min-h-[460px] sm:h-[640px] w-full"
        viewportStyle={mobileMaskStyle}
        onScroll={handleMobileCardsScroll}
      >
        <div className="space-y-3 pr-2.5 pt-1.5 pb-3">{children}</div>
      </ScrollArea>
    </div>
  );
}
