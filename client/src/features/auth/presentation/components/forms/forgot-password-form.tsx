"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";
import { authClient } from "@/lib/auth-client";
import { appToast } from "@/features/shared/presentation/components/notifications/toast";
import { getAuthErrorMessage } from "@/lib/auth-errors";
import { TextFormField } from "@/features/shared/presentation/components/forms/text-form-field";
import { SubmitButton } from "@/features/shared/presentation/components/custom-buttons/submit-button";
import { Mail, Send } from "lucide-react";

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (formData: FormData) => {
    const email = formData.get("email") as string;

    await authClient.requestPasswordReset(
      {
        email,
        redirectTo: "/auth/reset-password",
      },
      {
        onSuccess: () => {
          formRef.current?.reset();
          appToast.success(
            "Si ese email está registrado, recibirás un enlace para restablecer tu contraseña.",
          );
        },
        onError: (ctx) => {
          appToast.error(
            "Error al enviar el correo",
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
            id="email"
            name="email"
            placeholder="tu@correo.com"
            type="email"
            autoComplete="email"
            icon={<Mail className="size-4.5 text-slate-400" />}
            required
          />
        </div>

        <div className="pt-2">
          <SubmitButton
            text="Enviar enlace de recuperación"
            pendingText="Enviando..."
            icon={<Send className="size-4 shrink-0" />}
          />
        </div>
      </form>
    </div>
  );
}

export default ForgotPasswordForm;
