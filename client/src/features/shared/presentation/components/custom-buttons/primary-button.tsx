import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type PrimaryButtonProps = React.ComponentProps<typeof Button>;

/**
 * PrimaryButton — Botón con el color primario de la aplicación.
 * Utiliza el componente Button de Shadcn UI pero le aplica directamente
 * la clase bg-app-primary y text-app-primary-foreground definidas en el tema.
 */
export function PrimaryButton({ className, ...props }: PrimaryButtonProps) {
  return (
    <Button
      className={cn(
        "bg-gradient-to-r from-[#0e4dcb] via-[#1a66e5] to-[#2579f6] text-white hover:opacity-95 active:scale-[0.98] border-0 shadow-none",
        className
      )}
      {...props}
    />
  );
}

export default PrimaryButton;
