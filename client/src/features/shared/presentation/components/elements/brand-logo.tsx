import Link from "next/link";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  className?: string;
  href?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
};

export function BrandLogo({
  className,
  href = "/",
  showText = true,
  size = "md",
}: BrandLogoProps) {
  const iconSizes = {
    sm: "size-6",
    md: "size-8",
    lg: "size-10",
  };

  const textSizes = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-3xl",
  };

  const content = (
    <div className={cn("inline-flex items-center gap-2.5 select-none", className)}>
      {/* Icono de Pin de mapa característico con orificio circular */}
      <div className="relative flex items-center justify-center">
        <svg
          className={cn(iconSizes[size], "text-blue-600 fill-current shrink-0 drop-shadow-sm")}
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z"
            clipRule="evenodd"
          />
        </svg>
      </div>

      {showText && (
        <span
          className={cn(
            "font-bold tracking-tight text-slate-900 transition-colors",
            textSizes[size]
          )}
        >
          Visor<span className="text-blue-600 font-extrabold">SIG</span>
        </span>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-block transition-opacity hover:opacity-90">
        {content}
      </Link>
    );
  }

  return content;
}

export default BrandLogo;
