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
        "lg:hidden w-full pt-5 pb-1.5 px-6 sm:pt-7 sm:pb-3 sm:px-10 max-w-md sm:max-w-lg mx-auto flex flex-col justify-center select-none z-10",
        className
      )}
      data-purpose="auth-mobile-header"
    >
      {/* Logotipo de la Aplicación */}
      <div className="flex items-center gap-2.5">
        <BrandLogo size="md" textColor="white" />
      </div>

      {/* Eslogan / Título Llamativo */}
      <h1 className="mt-2 text-2xl sm:text-[28px] font-semibold tracking-tight text-white leading-snug">
        <span>{titlePrimary}</span>{" "}
        <span className="text-sky-300 font-bold">{titleHighlight}</span>
      </h1>
    </div>
  );
}

export default AuthMobileHeader;
