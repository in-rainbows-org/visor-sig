"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { authClient } from "@/lib/auth-client";
import { appToast } from "@/features/shared/presentation/components/notifications/toast";
import { getAuthErrorMessage } from "@/lib/auth-errors";
import { TextFormField } from "@/features/shared/presentation/components/forms/text-form-field";
import { SubmitButton } from "@/features/shared/presentation/components/custom-buttons/submit-button";
import { recordLoginAuditAction } from "@/features/audit-logs/presentation/hooks/use-audit-auth-log";
import { Mail, Lock, LogIn } from "lucide-react";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (formData: FormData) => {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    await authClient.signIn.email(
      {
        email,
        password,
        callbackURL: "/home",
        rememberMe: false,
      },
      {
        onSuccess: async () => {
          await recordLoginAuditAction();
          formRef.current?.reset();
          appToast.success("¡Bienvenido de vuelta!");
          router.push("/home");
        },
        onError: (ctx) => {
          appToast.error(
            "Error al iniciar sesión",
            getAuthErrorMessage(ctx.error.code),
          );
        },
      },
    );
  };

  return (
    <div className={cn("w-full", className)} {...props}>
      <form ref={formRef} action={handleSubmit} className="space-y-4">
        {/* Campo Correo o Nombre de usuario */}
        <div className="space-y-1.5">
          <TextFormField
            id="email"
            name="email"
            placeholder="Correo electrónico o nombre de usuario"
            type="email"
            autoComplete="email"
            icon={<Mail className="size-4.5 text-slate-400" />}
            required
          />
        </div>

        {/* Campo Contraseña con icono de candado y toggle ojo */}
        <div className="space-y-1.5">
          <TextFormField
            id="password"
            name="password"
            placeholder="Contraseña"
            type="password"
            autoComplete="current-password"
            icon={<Lock className="size-4.5 text-slate-400" />}
            required
          />
        </div>

        {/* Enlace Olvidaste tu contraseña alineado a la izquierda según la maqueta */}
        <div className="pt-0.5 pb-1">
          <Link
            href="/auth/forgot-password"
            className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors inline-block"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </div>

        {/* Botón de Enviar tipo píldora azul con icono LogIn */}
        <SubmitButton
          text="Iniciar sesión"
          pendingText="Iniciando sesión..."
          icon={<LogIn className="size-4.5 shrink-0" />}
        />
      </form>
    </div>
  );
}

export default LoginForm;
