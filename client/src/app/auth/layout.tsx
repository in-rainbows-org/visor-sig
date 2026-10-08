import { AuthBackground } from "@/features/auth/presentation/components/elements/auth-background";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-full h-[100dvh] w-full relative overflow-x-hidden overflow-y-auto select-none bg-[#eaf2fd] overscroll-contain">
      {/* Fondo con Ondas, Geometrías y Degradados Globales */}
      <AuthBackground />

      {/* Contenido de las páginas de autenticación */}
      <div className="relative z-10 min-h-full w-full">
        {children}
      </div>
    </div>
  );
}

