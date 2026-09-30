import { AuthBackground } from "@/features/auth/presentation/components/elements/auth-background";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full relative overflow-x-hidden select-none bg-[#eaf2fd]">
      {/* Fondo con Ondas, Geometrías y Degradados Globales */}
      <AuthBackground />

      {/* Contenido de las páginas de autenticación */}
      <div className="relative z-10 min-h-screen w-full">
        {children}
      </div>
    </div>
  );
}

