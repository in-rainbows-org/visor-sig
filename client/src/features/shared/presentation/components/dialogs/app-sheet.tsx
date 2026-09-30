"use client";

import type { ReactNode } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export type AppSheetSize = "sm" | "md" | "lg" | "xl" | "full" | "auto";
export type AppSheetSide = "top" | "bottom" | "left" | "right";

export type AppSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  side?: AppSheetSide;
  width?: AppSheetSize;
  height?: AppSheetSize;
  className?: string;
  bodyClassName?: string;
  preventCloseOnOutsideClick?: boolean;
  showCloseButton?: boolean;
  hideHeader?: boolean;
};

export function AppSheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  side = "right",
  width,
  height,
  className,
  bodyClassName,
  preventCloseOnOutsideClick = false,
  showCloseButton = false,
  hideHeader = false,
}: AppSheetProps) {
  // Computamos las clases dinámicas para controlar ancho y alto independientemente
  const getDimensionsClass = () => {
    // 1. Resolver Ancho
    const resolvedWidth = width || (side === "left" || side === "right" ? "md" : "full");
    const baseWidth = {
      sm: "w-full sm:w-[380px] sm:max-w-[380px]",
      md: "w-full sm:w-[480px] sm:max-w-[480px]",
      lg: "w-full sm:w-[540px] sm:max-w-[540px] lg:w-[600px] lg:max-w-[600px] xl:w-[640px] xl:max-w-[640px]",
      xl: "w-full sm:w-[640px] sm:max-w-[640px] lg:w-[720px] lg:max-w-[720px] xl:w-[780px] xl:max-w-[780px]",
      full: "w-full max-w-full",
      auto: "w-auto",
    }[resolvedWidth];

    // Si viene de arriba/abajo y tiene un ancho restringido, lo centramos horizontalmente
    const centerHorizontally = (side === "top" || side === "bottom") && resolvedWidth !== "full" ? "mx-auto" : "";

    // 2. Resolver Alto
    const resolvedHeight = height || (side === "top" || side === "bottom" ? "auto" : "full");
    const baseHeight = {
      sm: "h-full max-h-[33vh]",
      md: "h-full max-h-[50vh]",
      lg: "h-full max-h-[75vh]",
      xl: "h-full max-h-[90vh]",
      full: "h-full max-h-screen",
      auto: "h-auto",
    }[resolvedHeight];

    // Si viene de izquierda/derecha y tiene un alto restringido, lo centramos verticalmente
    const centerVertically = (side === "left" || side === "right") && resolvedHeight !== "full" ? "my-auto" : "";

    return cn(baseWidth, centerHorizontally, baseHeight, centerVertically);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={side}
        showCloseButton={showCloseButton}
        // Configuración para evitar cierre al hacer clic afuera (similar al Modal)
        onPointerDownOutside={
          preventCloseOnOutsideClick ? (e) => e.preventDefault() : undefined
        }
        onInteractOutside={
          preventCloseOnOutsideClick ? (e) => e.preventDefault() : undefined
        }
        className={cn(
          "flex flex-col bg-popover p-0 text-popover-foreground shadow-2xl",
          getDimensionsClass(),
          side === "top" && "rounded-b-2xl",
          side === "bottom" && "rounded-t-2xl",
          className
        )}
      >
        {hideHeader ? (
          <SheetHeader className="sr-only">
            <SheetTitle>{title}</SheetTitle>
            {description ? (
              <SheetDescription>{description}</SheetDescription>
            ) : null}
          </SheetHeader>
        ) : (
          <div className="border-b border-border px-6 pb-5 pt-7">
            <SheetHeader className="space-y-2 text-left pr-6">
              <SheetTitle className="text-2xl font-bold text-foreground">
                {title}
              </SheetTitle>
              {description ? (
                <SheetDescription className="text-sm text-muted-foreground">
                  {description}
                </SheetDescription>
              ) : null}
            </SheetHeader>
          </div>
        )}
        
        {/* Cuerpo del sheet con scroll interno si hay mucho contenido */}
        <div className={cn("px-6 py-6 flex-1 overflow-y-auto", bodyClassName)}>
          {children}
        </div>
      </SheetContent>
    </Sheet>
  );
}
