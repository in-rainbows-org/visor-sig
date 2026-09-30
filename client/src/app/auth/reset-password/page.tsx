import { Suspense } from "react";
import Link from "next/link";
import { ResetPasswordForm } from "@/features/auth/presentation/components/forms/reset-password-form";
import { AuthCard } from "@/features/auth/presentation/components/elements/auth-card";
import { ArrowLeft } from "lucide-react";

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <AuthCard variant="centered">
        <div className="w-full flex flex-col gap-6">
          {/* Encabezado del Formulario */}
          <div>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">
              Nueva contraseña
            </h2>
            <p className="mt-2 text-sm text-slate-500 font-normal">
              Elige una contraseña segura para tu cuenta.
            </p>
          </div>

          {/* Formulario de Restablecimiento */}
          <Suspense fallback={<div className="h-40 flex items-center justify-center text-sm text-slate-400">Cargando...</div>}>
            <ResetPasswordForm />
          </Suspense>

          {/* Enlace para volver al login */}
          <p className="text-center text-xs sm:text-sm text-slate-500 pt-2">
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-1.5 font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-colors"
            >
              <ArrowLeft className="size-4" />
              Volver a iniciar sesión
            </Link>
          </p>
        </div>
      </AuthCard>
    </main>
  );
}
