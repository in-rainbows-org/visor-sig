import Image from "next/image";
import BrandLogo from "@/features/shared/presentation/components/elements/brand-logo";
import { cn } from "@/lib/utils";

type AuthBrandHeroProps = {
  tagline?: string;
  titlePrimary?: string;
  titleHighlight?: string;
  description?: string;
  imageSrc?: string;
  imageAlt?: string;
  imagePosition?: "bottom-left" | "bottom-right";
  imageClassName?: string;
  className?: string;
};

export function AuthBrandHero({
  tagline = "Soluciones geoespaciales, decisiones precisas.",
  titlePrimary = "Gestiona tu territorio,",
  titleHighlight = "en cualquier lugar.",
  description = "Nuestra plataforma te ofrece una forma simple, segura y rápida de administrar y visualizar información geográfica en todo momento.",
  imageSrc = "/images/login.png",
  imageAlt = "VisorSIG en dispositivo móvil",
  imagePosition = "bottom-left",
  imageClassName,
  className,
}: AuthBrandHeroProps) {
  return (
    <section
      className={cn(
        "relative lg:w-[50%] xl:w-[52%] hidden lg:flex flex-col justify-between pt-8 sm:pt-12 lg:pt-14 xl:pt-16 px-8 sm:px-12 lg:px-14 xl:px-16 pb-0 overflow-hidden min-h-screen select-none z-10",
        className
      )}
      data-purpose="hero-promotional-panel"
    >
      {/* ── Fila 1 (Superior): Logo + Slogan + Título Extendido + Descripción ── */}
      <div className="relative z-10 w-full max-w-2xl pt-2 pb-4 flex flex-col justify-start shrink-0">
        {/* Nombre de la Aplicación y Logo */}
        <div className="flex items-center gap-2.5">
          <BrandLogo size="md" textColor="white" />
        </div>

        {/* Slogan */}
        <p className="mt-5 text-[14.5px] font-medium text-sky-200 tracking-normal">
          {tagline}
        </p>

        {/* Título en Dos Tonos extendido a todo el ancho */}
        <h1 className="mt-3 text-4xl sm:text-5xl lg:text-[44px] xl:text-[50px] font-semibold tracking-tight text-white leading-[1.14]">
          <span className="text-white block xl:inline">{titlePrimary}</span>{" "}
          <span className="text-sky-300 block xl:inline font-bold">{titleHighlight}</span>
        </h1>

        {/* Descripción completa que ocupa el ancho de la sección sin sobreponerse */}
        <p className="mt-4 text-blue-100/90 text-base lg:text-[16.5px] font-light leading-relaxed max-w-xl xl:max-w-2xl">
          {description}
        </p>
      </div>

      {/* ── Fila 2 (Inferior): Contenedor que ocupa el full height hacia abajo y nace desde el fin de la pantalla ── */}
      <div
        className={cn(
          "relative z-10 w-full flex-1 flex items-end",
          imagePosition === "bottom-left"
            ? "justify-start pl-6 sm:pl-10 lg:pl-14 xl:pl-20 2xl:pl-24"
            : "justify-end pr-10 sm:pr-16 lg:pr-24 xl:pr-32 2xl:pr-36"
        )}
      >
        <div
          className={cn(
            "relative pointer-events-none select-none flex items-end",
            imagePosition === "bottom-left"
              ? "-mb-5 sm:-mb-7 lg:-mb-9 xl:-mb-10 2xl:-mb-11 w-[380px] sm:w-[430px] lg:w-[488px] xl:w-[538px] 2xl:w-[595px]"
              : "mb-0 sm:mb-2 lg:mb-4 xl:mb-6 w-[495px] sm:w-[560px] lg:w-[630px] xl:w-[700px] 2xl:w-[760px]",
            imageClassName
          )}
        >
          <Image
            src={imageSrc}
            alt={imageAlt}
            width={800}
            height={1000}
            priority
            className="w-full h-auto object-contain object-bottom drop-shadow-[0_25px_35px_rgba(30,58,138,0.22)]"
          />
        </div>
      </div>
    </section>
  );
}

export default AuthBrandHero;
