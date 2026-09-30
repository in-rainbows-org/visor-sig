import { Suspense } from "react";
import Link from "next/link";
import { LoginForm } from "@/features/auth/presentation/components/forms/login-form";
import SocialSignInButtons from "@/features/auth/presentation/components/elements/social-sign-in-buttons";
import AuthErrorNotifier from "@/features/auth/presentation/components/elements/auth-error-notifier";
import { AuthBrandHero } from "@/features/auth/presentation/components/elements/auth-brand-hero";
import { AuthMobileHeader } from "@/features/auth/presentation/components/elements/auth-mobile-header";
import { AuthCard } from "@/features/auth/presentation/components/elements/auth-card";

export default function LoginPage() {
  return (
    <main className="min-h-screen w-full flex flex-col lg:flex-row relative">
      {/* Cabecera Móvil y Tablet (< lg): Logotipo + Eslogan en fondo continuo */}
      <AuthMobileHeader
        titlePrimary="Gestiona tu territorio,"
        titleHighlight="en cualquier lugar."
      />

      {/* Columna Izquierda Desktop (>= lg): Panel Hero Promocional (Gráficos, imagen smartphone PNG, identidad) */}
      <AuthBrandHero
        imageSrc="/images/login.png"
        imageAlt="VisorSIG en dispositivo móvil"
        tagline="Soluciones geoespaciales, decisiones precisas."
        titlePrimary="Gestiona tu territorio,"
        titleHighlight="en cualquier lugar."
        description="Nuestra plataforma te ofrece una forma simple, segura y rápida de administrar y visualizar información geográfica en todo momento."
      />

      {/* Columna Derecha: Tarjeta Blanca Full Height & Full Width del lado derecho con esquinas izquierdas redondeadas */}
      <AuthCard variant="side-right">
        <div className="w-full flex flex-col gap-6">
          {/* Notificador de errores OAuth en URL */}
          <Suspense>
            <AuthErrorNotifier />
          </Suspense>

          {/* Encabezado del Formulario fiel a Stitch */}
          <div>
            <h2 className="text-3xl sm:text-[32px] font-semibold tracking-tight text-slate-900 leading-tight">
              Iniciar sesión
            </h2>
            <p className="mt-2 text-[14.5px] font-normal text-slate-500 leading-relaxed">
              Bienvenido de nuevo, por favor ingresa a tu cuenta para continuar.
            </p>
          </div>

          {/* Formulario de Login */}
          <LoginForm />

          {/* Separador */}
          <div className="relative my-1">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-slate-400 font-medium">
                o continúa con
              </span>
            </div>
          </div>

          {/* Botones de Autenticación Social (solo Google) */}
          <SocialSignInButtons />

          {/* Enlace para registrarse */}
          <p className="text-center text-sm text-slate-500 pt-2">
            ¿No tienes cuenta?{" "}
            <Link
              href="/auth/signup"
              className="font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-colors"
            >
              Regístrate
            </Link>
          </p>
        </div>
      </AuthCard>
    </main>
  );
}
