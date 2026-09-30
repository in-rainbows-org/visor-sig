"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { authClient } from "@/lib/auth-client";
import { appToast } from "@/features/shared/presentation/components/notifications/toast";
import { getAuthErrorMessage } from "@/lib/auth-errors";
import { TextFormField } from "@/features/shared/presentation/components/forms/text-form-field";
import { SubmitButton } from "@/features/shared/presentation/components/custom-buttons/submit-button";
import { User, Mail, Lock, UserPlus } from "lucide-react";

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (formData: FormData) => {
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    await authClient.signUp.email(
      {
        name,
        email,
        password,
        callbackURL: "/home",
      },
      {
        onSuccess: () => {
          formRef.current?.reset();
          appToast.success("¡Registro exitoso! Por favor verifica tu email.");
          router.push("/auth/verify-email");
        },
        onError: (ctx) => {
          appToast.error(
            "Error al registrarse",
            getAuthErrorMessage(ctx.error.code),
          );
        },
      },
    );
  };

  return (
    <div className={cn("w-full", className)} {...props}>
      <form ref={formRef} action={handleSubmit} className="space-y-4">
        {/* Campo Nombre */}
        <div className="space-y-1.5">
          <TextFormField
            id="name"
            name="name"
            placeholder="Nombre completo"
            type="text"
            autoComplete="name"
            icon={<User className="size-4.5 text-slate-400" />}
            required
          />
        </div>

        {/* Campo Correo */}
        <div className="space-y-1.5">
          <TextFormField
            id="email"
            name="email"
            placeholder="Correo electrónico"
            type="email"
            autoComplete="email"
            icon={<Mail className="size-4.5 text-slate-400" />}
            required
          />
        </div>

        {/* Campo Contraseña */}
        <div className="space-y-1.5">
          <TextFormField
            id="password"
            name="password"
            placeholder="Contraseña (mínimo 8 caracteres)"
            type="password"
            autoComplete="new-password"
            icon={<Lock className="size-4.5 text-slate-400" />}
            required
          />
        </div>

        {/* Botón de Enviar tipo píldora azul */}
        <div className="pt-2">
          <SubmitButton
            text="Crear cuenta"
            pendingText="Creando cuenta..."
            icon={<UserPlus className="size-4.5 shrink-0" />}
          />
        </div>
      </form>
    </div>
  );
}

export default SignupForm;
