import Link from "next/link";
import { SignupForm } from "@/features/auth/presentation/components/forms/signup-form";
import SocialSignInButtons from "@/features/auth/presentation/components/elements/social-sign-in-buttons";
import { AuthBrandHero } from "@/features/auth/presentation/components/elements/auth-brand-hero";
import { AuthMobileHeader } from "@/features/auth/presentation/components/elements/auth-mobile-header";
import { AuthCard } from "@/features/auth/presentation/components/elements/auth-card";

export default function SignupPage() {
  return (
    <main className="min-h-screen w-full flex flex-col lg:flex-row relative">
      {/* Cabecera Móvil y Tablet (< lg): Logotipo + Eslogan en fondo continuo */}
      <AuthMobileHeader
        titlePrimary="Únete a VisorSIG,"
        titleHighlight="comienza hoy."
      />

      {/* Columna Izquierda Desktop (>= lg) / Parte Inferior Móvil: Tarjeta Blanca */}
      <AuthCard variant="side-left">
        <div className="w-full flex flex-col gap-6">
          {/* Encabezado del Formulario */}
          <div>
            <h2 className="text-3xl sm:text-[32px] font-semibold tracking-tight text-slate-900 leading-tight">
              Crear cuenta
            </h2>
            <p className="mt-2 text-[14.5px] font-normal text-slate-500 leading-relaxed">
              Completa tus datos para comenzar en VisorSIG.
            </p>
          </div>

          {/* Formulario de Registro */}
          <SignupForm />

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

          {/* Enlace para iniciar sesión */}
          <p className="text-center text-sm text-slate-500 pt-2">
            ¿Ya tienes cuenta?{" "}
            <Link
              href="/auth/login"
              className="font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-colors"
            >
              Inicia sesión
            </Link>
          </p>
        </div>
      </AuthCard>

      {/* Columna Derecha: Panel Hero Promocional con /images/register.png */}
      <AuthBrandHero
        imageSrc="/images/register.png"
        imageAlt="Registro en VisorSIG"
        imagePosition="bottom-right"
        tagline="Comienza a transformar tus datos territoriales."
        titlePrimary="Únete a VisorSIG,"
        titleHighlight="comienza hoy."
        description="Crea tu cuenta en minutos y accede a herramientas avanzadas para la toma de decisiones geoespaciales precisas."
      />
    </main>
  );
}
