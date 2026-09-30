"use client";

import { useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { authClient } from "@/lib/auth-client";
import { appToast } from "@/features/shared/presentation/components/notifications/toast";
import { getAuthErrorMessage } from "@/lib/auth-errors";
import { TextFormField } from "@/features/shared/presentation/components/forms/text-form-field";
import { SubmitButton } from "@/features/shared/presentation/components/custom-buttons/submit-button";
import { Lock, KeyRound } from "lucide-react";

export function ResetPasswordForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (formData: FormData) => {
    const newPassword = formData.get("newPassword") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (newPassword !== confirmPassword) {
      appToast.error("Error", "Las contraseñas no coinciden.");
      return;
    }

    const token = searchParams.get("token");

    if (!token) {
      appToast.error(
        "Enlace inválido",
        "El enlace de recuperación no es válido o ha expirado.",
      );
      return;
    }

    await authClient.resetPassword(
      {
        newPassword,
        token,
      },
      {
        onSuccess: () => {
          formRef.current?.reset();
          appToast.success(
            "¡Contraseña actualizada! Ya puedes iniciar sesión.",
          );
          router.push("/auth/login");
        },
        onError: (ctx) => {
          appToast.error(
            "Error al restablecer",
            getAuthErrorMessage(ctx.error.code),
          );
        },
      },
    );
  };

  return (
    <div className={cn("w-full", className)} {...props}>
      <form ref={formRef} action={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <TextFormField
            id="newPassword"
            name="newPassword"
            placeholder="Nueva contraseña (mínimo 8 caracteres)"
            type="password"
            autoComplete="new-password"
            icon={<Lock className="size-4.5 text-slate-400" />}
            required
          />
        </div>

        <div className="space-y-1.5">
          <TextFormField
            id="confirmPassword"
            name="confirmPassword"
            placeholder="Confirmar nueva contraseña"
            type="password"
            autoComplete="new-password"
            icon={<Lock className="size-4.5 text-slate-400" />}
            required
          />
        </div>

        <div className="pt-2">
          <SubmitButton
            text="Restablecer contraseña"
            pendingText="Restableciendo..."
            icon={<KeyRound className="size-4.5 shrink-0" />}
          />
        </div>
      </form>
    </div>
  );
}

export default ResetPasswordForm;
