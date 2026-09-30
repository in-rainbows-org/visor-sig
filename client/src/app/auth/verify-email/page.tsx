import Link from "next/link";
import { AuthCard } from "@/features/auth/presentation/components/elements/auth-card";
import { Mail, ArrowLeft } from "lucide-react";

export default function VerificationPage() {
  return (
    <main className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <AuthCard variant="centered">
        <div className="w-full flex flex-col items-center text-center gap-5 py-2">
          <div className="flex size-16 items-center justify-center rounded-full bg-blue-50 text-blue-600 shadow-sm border border-blue-100">
            <Mail className="size-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
              Revisa tu correo electrónico
            </h2>
            <p className="text-sm text-slate-500 font-normal max-w-sm mx-auto">
              Hemos enviado un enlace de verificación a tu correo. Ábrelo y haz clic
              en el enlace para activar tu cuenta.
            </p>
          </div>

          <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4 text-xs text-slate-500 max-w-sm">
            Si no encuentras el correo, revisa tu carpeta de spam o correo no deseado.
            El enlace expirará en unos minutos.
          </div>

          <div className="pt-2">
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2 h-11 px-6 rounded-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-sm font-medium transition-colors"
            >
              <ArrowLeft className="size-4" />
              Volver al inicio de sesión
            </Link>
          </div>
        </div>
      </AuthCard>
    </main>
  );
}
