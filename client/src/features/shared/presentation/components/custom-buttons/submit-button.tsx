"use client";

import { ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { PrimaryButton } from "./primary-button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

type SubmitButtonProps = {
  text: string;
  pendingText?: string;
  icon?: ReactNode;
  className?: string;
  disabled?: boolean;
};

/**
 * SubmitButton — Botón de envío para formularios con el aspecto visual de PrimaryButton.
 * Escucha automáticamente el estado del formulario con useFormStatus y muestra
 * un spinner de carga y el pendingText mientras se procesa la acción.
 */
export function SubmitButton({
  text,
  pendingText = "Procesando...",
  icon,
  className,
  disabled,
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <PrimaryButton
      type="submit"
      disabled={disabled || pending}
      className={cn(
        "w-full h-12 rounded-full font-medium text-sm sm:text-[15px] flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-md shadow-blue-500/20 active:scale-[0.99]",
        className
      )}
    >
      {pending ? (
        <>
          <Spinner className="size-4.5 text-app-primary-foreground" />
          <span>{pendingText}</span>
        </>
      ) : (
        <>
          {icon}
          <span>{text}</span>
        </>
      )}
    </PrimaryButton>
  );
}

export default SubmitButton;

