import BrandLogo from "@/features/shared/presentation/components/elements/brand-logo";
import { cn } from "@/lib/utils";

type AuthMobileHeaderProps = {
  titlePrimary: string;
  titleHighlight: string;
  className?: string;
};

export function AuthMobileHeader({
  titlePrimary,
  titleHighlight,
  className,
}: AuthMobileHeaderProps) {
  return (
    <div
      className={cn(
        "lg:hidden w-full pt-8 pb-5 px-6 sm:pt-10 sm:pb-7 sm:px-10 max-w-md sm:max-w-lg mx-auto flex flex-col justify-center select-none z-10",
        className
      )}
      data-purpose="auth-mobile-header"
    >
      {/* Logotipo de la Aplicación */}
      <div className="flex items-center gap-2.5">
        <BrandLogo size="md" />
      </div>

      {/* Eslogan / Título Llamativo */}
      <h1 className="mt-3.5 text-2xl sm:text-[28px] font-semibold tracking-tight text-slate-900 leading-snug">
        <span>{titlePrimary}</span>{" "}
        <span className="text-blue-600 font-bold">{titleHighlight}</span>
      </h1>
    </div>
  );
}

export default AuthMobileHeader;
