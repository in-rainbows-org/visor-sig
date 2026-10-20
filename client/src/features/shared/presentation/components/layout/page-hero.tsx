"use client";

import React, { useEffect, useRef } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useLayoutScroll } from "@/features/shared/presentation/context/layout-scroll-context";

export type PageHeroProps = {
  /** Main module headline displayed in bold white text */
  title: string;
  /** Brief descriptive text summarizing the module purpose */
  description: string;
  /** Relative path to the 3D illustration in /hero-icons/ */
  iconSrc: string;
  /** Accessible alternative text for the image */
  iconAlt?: string;
  /** Optional CSS classes for container fine-tuning */
  className?: string;
};

/**
 * Reusable primary blue hero banner designed to sit seamlessly attached
 * behind `AppHeader`, sharing its background and terminating with large
 * rounded bottom corners over the light content canvas.
 */
export function PageHero({
  title,
  description,
  iconSrc,
  iconAlt,
  className,
}: PageHeroProps) {
  const heroRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const { setIsHeroMounted } = useLayoutScroll();

  useEffect(() => {
    setIsHeroMounted(true);
    const el = heroRef.current;
    const contentEl = contentRef.current;
    if (!el) return;

    // Detectar el contenedor con scroll vertical más próximo
    const scrollContainer = el.closest(".overflow-y-auto") as HTMLElement | null;
    if (!scrollContainer) return;

    const handleScroll = () => {
      const y = scrollContainer.scrollTop;
      // Sincroniza la posición vertical con la variable CSS del bloque de esquina
      document.documentElement.style.setProperty("--hero-scroll-y", `${y}px`);

      // 1. Desvanecido general más tardado (recorrido extendido a 220px de scroll)
      const opacity = Math.max(0, Math.min(1, 1 - y / 220));
      if (contentRef.current) {
        contentRef.current.style.opacity = opacity.toString();

        // 2. Efecto de difuminado/disolución progresivo al pasar por debajo del header
        const headerEl = document.querySelector('[data-purpose="top-header"]');
        const headerBottom = headerEl
          ? headerEl.getBoundingClientRect().bottom
          : window.innerWidth >= 1024
          ? 77
          : 80;
        const contentTop = contentRef.current.getBoundingClientRect().top;
        const distanceIntoHeader = headerBottom - contentTop;

        const featherZone = 40; // Franja de 40px de disolución suave

        if (distanceIntoHeader <= 0) {
          contentRef.current.style.maskImage = "none";
          contentRef.current.style.webkitMaskImage = "none";
        } else {
          const featherStart = distanceIntoHeader;
          const featherEnd = distanceIntoHeader + featherZone;
          const maskValue = `linear-gradient(to bottom, transparent 0px, transparent ${featherStart}px, black ${featherEnd}px, black 100%)`;
          contentRef.current.style.maskImage = maskValue;
          contentRef.current.style.webkitMaskImage = maskValue;
        }
      }

      document.documentElement.style.setProperty(
        "--hero-content-opacity",
        opacity.toString()
      );
    };

    handleScroll();
    scrollContainer.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      scrollContainer.removeEventListener("scroll", handleScroll);
      setIsHeroMounted(false);
      document.documentElement.style.setProperty("--hero-scroll-y", "0px");
      document.documentElement.style.setProperty("--hero-content-opacity", "1");
      if (contentEl) {
        contentEl.style.opacity = "1";
        contentEl.style.maskImage = "none";
        contentEl.style.webkitMaskImage = "none";
      }
    };
  }, [setIsHeroMounted]);

  return (
    <section
      ref={heroRef}
      data-purpose="page-hero"
      className={cn(
        "w-full bg-[#0e4dcb] bg-hero-gradient-hero text-white rounded-b-[40px] sm:rounded-b-[48px] pt-16 sm:pt-16 lg:pt-11 pb-8 sm:pb-9 lg:pb-6 px-6 sm:px-10 lg:px-14 xl:px-18 shrink-0 border-0 shadow-none relative",
        className
      )}
      style={{
        backgroundImage:
          "linear-gradient(to right, #0e4dcb 0%, #135ad6 28%, #1c6ee7 68%, #3392f9 100%)",
        backgroundSize: "100vw 100%",
      }}
    >
      <div
        ref={contentRef}
        data-purpose="page-hero-content"
        className="w-full"
        style={{ willChange: "opacity, mask-image" }}
      >
        <div className="w-full flex items-center justify-between gap-6 sm:gap-10 lg:gap-14 animate-hero-pop">
          <div className="min-w-0 flex-1 max-w-2xl lg:max-w-3xl xl:max-w-4xl">
            <h1 className="text-[28px] sm:text-4xl lg:text-[40px] xl:text-[44px] font-extrabold tracking-tight text-white leading-tight">
              {title}
            </h1>
            <p className="text-sm sm:text-base lg:text-[15px] xl:text-base text-blue-100/90 font-medium max-w-xl mt-2 leading-relaxed">
              {description}
            </p>
          </div>

          <Image
            src={iconSrc}
            alt={iconAlt ?? title}
            width={140}
            height={140}
            priority
            className="w-20 h-20 sm:w-28 sm:h-28 lg:w-28 lg:h-28 xl:w-32 xl:h-32 object-contain drop-shadow-xl shrink-0 transition-transform duration-300 hover:scale-105"
          />
        </div>
      </div>
    </section>
  );
}

export default PageHero;
