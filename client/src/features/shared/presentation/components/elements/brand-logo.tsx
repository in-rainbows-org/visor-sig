import Image from "next/image";
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
  const pixelSizes = {
    sm: 30,
    md: 60,
    lg: 60,
  };

  const textSizes = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-3xl",
  };

  const px = pixelSizes[size];

  const content = (
    <div className={cn("inline-flex items-center gap-2.5 select-none", className)}>
      {/* Icono WebP oficial de VisorSIG */}
      <div className="relative flex items-center justify-center shrink-0">
        <Image
          src="/assets/icon.png"
          alt="VisorSIG"
          width={px}
          height={px}
          priority
          style={{ width: "auto", height: "auto" }}
          className="object-contain drop-shadow-xs"
        />
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
