import BrandLogo from "@/features/shared/presentation/components/elements/brand-logo";
import { cn } from "@/lib/utils";

export type AuthCardVariant = "side-right" | "side-left" | "centered";

type AuthCardProps = {
  children: React.ReactNode;
  variant?: AuthCardVariant;
  className?: string;
  showLogo?: boolean;
};

export function AuthCard({
  children,
  variant = "side-right",
  className,
  showLogo = true,
}: AuthCardProps) {
  if (variant === "centered") {
    return (
      <div
        className={cn(
          "w-full max-w-[480px] bg-white rounded-[44px] sm:rounded-[56px] shadow-2xl z-20 p-8 sm:p-10 lg:p-12 flex flex-col justify-center my-auto",
          className
        )}
      >
        {showLogo && (
          <div className="mb-6 flex justify-center">
            <BrandLogo size="md" />
          </div>
        )}
        <div className="w-full">{children}</div>
      </div>
    );
  }

  const roundedClasses =
    variant === "side-right"
      ? "rounded-t-[36px] sm:rounded-t-[44px] lg:rounded-t-none lg:rounded-l-[58px]"
      : "rounded-t-[36px] sm:rounded-t-[44px] lg:rounded-t-none lg:rounded-r-[58px]";

  return (
    <section
      className={cn(
        "relative w-full lg:w-[50%] xl:w-[48%] bg-white flex flex-col justify-center shadow-2xl z-20 flex-1 lg:min-h-screen p-6 sm:p-10 lg:p-14 xl:px-20 xl:py-12",
        roundedClasses,
        className
      )}
      data-purpose={variant === "side-right" ? "auth-login-card" : "auth-signup-card"}
    >
      {/* Contenedor central del formulario */}
      <div className="w-full max-w-[430px] mx-auto py-3 sm:py-6 lg:py-8">
        {showLogo && (
          <div className="hidden lg:flex items-center gap-3 mb-8 sm:mb-10">
            <BrandLogo size="md" />
          </div>
        )}
        {children}
      </div>
    </section>
  );
}

export default AuthCard;
