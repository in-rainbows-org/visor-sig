import Image from "next/image";

export function AuthBackground() {
  return (
    <div
      className="fixed inset-0 w-full h-full pointer-events-none overflow-hidden select-none z-0 bg-[#eaf2fd] bg-gradient-to-br from-[#ebf4ff] via-[#dbeafe] to-[#eff6ff]"
      aria-hidden="true"
    >
      {/* ── Resplandores Radiales Suaves Difuminados ─────────────────────────── */}
      <div className="absolute -top-24 -left-24 w-[520px] h-[520px] rounded-full bg-blue-300/35 blur-3xl" />
      <div className="absolute top-1/4 left-1/3 w-[600px] h-[600px] rounded-full bg-indigo-200/25 blur-3xl" />
      <div className="absolute -top-24 -right-24 w-[520px] h-[520px] rounded-full bg-sky-300/35 blur-3xl" />
      <div className="absolute -bottom-24 left-1/4 w-[560px] h-[560px] rounded-full bg-blue-300/30 blur-3xl" />
      <div className="absolute -bottom-24 -right-24 w-[520px] h-[520px] rounded-full bg-sky-200/35 blur-3xl" />

      {/* ── Ondas y Líneas Orgánicas SVG que cruzan todo el ancho ─────────────── */}
      <svg
        className="absolute bottom-0 left-0 w-full h-[65%] pointer-events-none opacity-65 z-0"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 1600 700"
      >
        <path
          d="M-100 700 C 200 560, 450 380, 800 560 C 1150 740, 1400 440, 1700 480 L 1700 700 Z"
          fill="url(#globalWaveGrad1)"
          opacity="0.45"
        />
        <path
          d="M-50 700 C 250 640, 500 440, 900 640 C 1300 600, 1500 480, 1750 700 Z"
          fill="url(#globalWaveGrad2)"
          opacity="0.6"
        />
        <path
          d="M 0 580 C 350 490, 700 620, 1100 490 C 1350 410, 1500 520, 1650 560"
          stroke="#93c5fd"
          strokeWidth="1.5"
          strokeDasharray="6 6"
          opacity="0.7"
        />
        <path
          d="M -50 460 C 300 380, 650 490, 1050 370 C 1350 280, 1500 390, 1680 430"
          stroke="#60a5fa"
          strokeWidth="1.25"
          strokeDasharray="4 4"
          opacity="0.5"
        />

        <defs>
          <linearGradient id="globalWaveGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#bfdbfe" stopOpacity="0.85" />
            <stop offset="50%" stopColor="#dbeafe" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.3" />
          </linearGradient>
          <linearGradient id="globalWaveGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#93c5fd" stopOpacity="0.75" />
            <stop offset="60%" stopColor="#bfdbfe" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#dbeafe" stopOpacity="0.25" />
          </linearGradient>
        </defs>
      </svg>

      {/* ── SECTOR IZQUIERDO (0% a 50% del ancho de pantalla) ────────────────── */}

      {/* Detalle 1: Mapa 3D con Pin (Superior Izquierda, movido ~40% más a la derecha) */}
      <div className="hidden lg:flex absolute top-[9%] sm:top-[11%] lg:top-[12%] left-[17%] sm:left-[19%] lg:left-[22%] xl:left-[24%] z-10 pointer-events-none items-center justify-center animate-float-1 transition-transform duration-500 hover:scale-105">
        {/* Resplandor suave */}
        <div className="absolute inset-0 -m-5 rounded-full bg-blue-300/35 blur-xl pointer-events-none" />

        {/* Linework SVG: Retícula de radar y anillos concéntricos */}
        <svg
          className="absolute -inset-6 w-[calc(100%+48px)] h-[calc(100%+48px)] pointer-events-none"
          viewBox="0 0 140 140"
          fill="none"
        >
          <circle cx="70" cy="70" r="54" stroke="#93c5fd" strokeWidth="1" strokeDasharray="3 3" opacity="0.65" />
          <circle cx="70" cy="70" r="42" stroke="#60a5fa" strokeWidth="0.75" opacity="0.45" />
          <line x1="70" y1="8" x2="70" y2="18" stroke="#2563eb" strokeWidth="1.2" opacity="0.7" />
          <line x1="70" y1="122" x2="70" y2="132" stroke="#2563eb" strokeWidth="1.2" opacity="0.7" />
          <line x1="8" y1="70" x2="18" y2="70" stroke="#2563eb" strokeWidth="1.2" opacity="0.7" />
          <line x1="122" y1="70" x2="132" y2="70" stroke="#2563eb" strokeWidth="1.2" opacity="0.7" />
          <path d="M 70 16 A 54 54 0 0 1 124 70" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" opacity="0.55" />
          <circle cx="108" cy="32" r="2.5" fill="#2563eb" opacity="0.85" />
          <line x1="108" y1="32" x2="124" y2="20" stroke="#60a5fa" strokeWidth="1" strokeDasharray="2 2" opacity="0.7" />
        </svg>

        <Image
          src="/assets/detail1.png"
          alt="Detalle mapa con pin"
          width={84}
          height={84}
          className="w-[61px] sm:w-[69px] lg:w-[78px] h-auto object-contain -rotate-12 drop-shadow-[0_12px_22px_rgba(37,99,235,0.2)] opacity-90"
        />
      </div>

      {/* Detalle 3: Brújula y flecha de rumbo (Centro-Interior del sector izquierdo, mantenido sin mover) */}
      <div className="hidden lg:flex absolute top-[41%] sm:top-[43%] lg:top-[44%] left-[22%] sm:left-[26%] lg:left-[30%] xl:left-[33%] z-10 pointer-events-none items-center justify-center animate-float-2 transition-transform duration-500 hover:scale-105">
        {/* Resplandor suave */}
        <div className="absolute inset-0 -m-5 rounded-full bg-indigo-300/30 blur-xl pointer-events-none" />

        {/* Linework SVG: Rosa de los vientos y líneas cardinales */}
        <svg
          className="absolute -inset-6 w-[calc(100%+48px)] h-[calc(100%+48px)] pointer-events-none"
          viewBox="0 0 140 140"
          fill="none"
        >
          <circle cx="70" cy="70" r="50" stroke="#93c5fd" strokeWidth="1" opacity="0.55" />
          <circle cx="70" cy="70" r="58" stroke="#60a5fa" strokeWidth="0.75" strokeDasharray="3 4" opacity="0.45" />
          <line x1="70" y1="12" x2="70" y2="22" stroke="#2563eb" strokeWidth="1.5" opacity="0.8" />
          <line x1="128" y1="70" x2="118" y2="70" stroke="#2563eb" strokeWidth="1" opacity="0.6" />
          <line x1="70" y1="128" x2="70" y2="118" stroke="#2563eb" strokeWidth="1" opacity="0.6" />
          <line x1="12" y1="70" x2="22" y2="70" stroke="#2563eb" strokeWidth="1" opacity="0.6" />
          <circle cx="112" cy="42" r="2.5" fill="#2563eb" opacity="0.85" />
          <line x1="112" y1="42" x2="126" y2="28" stroke="#60a5fa" strokeWidth="1" strokeDasharray="2 2" opacity="0.7" />
        </svg>

        <Image
          src="/assets/detail3.png"
          alt="Detalle brújula de navegación"
          width={77}
          height={77}
          className="w-[55px] sm:w-[65px] lg:w-[74px] h-auto object-contain rotate-6 drop-shadow-[0_10px_18px_rgba(37,99,235,0.18)] opacity-85"
        />
      </div>

      {/* Detalle 5: Dial de rumbo / compás (Inferior del sector izquierdo, movido cerca del borde izquierdo) */}
      <div className="hidden lg:flex absolute bottom-[10%] sm:bottom-[12%] lg:bottom-[13%] left-[2%] sm:left-[2.5%] lg:left-[3%] xl:left-[3.5%] z-10 pointer-events-none items-center justify-center animate-float-3 transition-transform duration-500 hover:scale-105">
        {/* Resplandor suave */}
        <div className="absolute inset-0 -m-5 rounded-full bg-blue-300/30 blur-xl pointer-events-none" />

        {/* Linework SVG: Dial graduado y arco de rumbo */}
        <svg
          className="absolute -inset-6 w-[calc(100%+48px)] h-[calc(100%+48px)] pointer-events-none"
          viewBox="0 0 140 140"
          fill="none"
        >
          <circle cx="70" cy="70" r="54" stroke="#93c5fd" strokeWidth="1" opacity="0.5" />
          <circle cx="70" cy="70" r="46" stroke="#60a5fa" strokeWidth="0.75" strokeDasharray="2 3" opacity="0.45" />
          <path d="M 70 16 A 54 54 0 0 1 120 46" stroke="#2563eb" strokeWidth="1.75" strokeLinecap="round" opacity="0.6" />
          <line x1="70" y1="10" x2="70" y2="18" stroke="#2563eb" strokeWidth="1.5" opacity="0.8" />
          <circle cx="28" cy="98" r="2.5" fill="#2563eb" opacity="0.8" />
          <line x1="28" y1="98" x2="16" y2="110" stroke="#60a5fa" strokeWidth="1" strokeDasharray="2 2" opacity="0.7" />
        </svg>

        <Image
          src="/assets/detail5.png"
          alt="Detalle brújula"
          width={84}
          height={84}
          className="w-[61px] sm:w-[69px] lg:w-[78px] h-auto object-contain -rotate-6 drop-shadow-[0_12px_22px_rgba(37,99,235,0.2)] opacity-85"
        />
      </div>

      {/* ── SECTOR DERECHO (50% a 100% del ancho de pantalla) ────────────────── */}

      {/* Detalle 2: Globo terráqueo con anillo orbital (Superior del sector derecho, movido 20-30% más a la derecha) */}
      <div className="hidden lg:flex absolute top-[9%] sm:top-[11%] lg:top-[12%] right-[14%] sm:right-[16%] lg:right-[18%] xl:right-[20%] z-10 pointer-events-none items-center justify-center animate-float-2 transition-transform duration-500 hover:scale-105">
        {/* Resplandor suave */}
        <div className="absolute inset-0 -m-5 rounded-full bg-sky-300/35 blur-xl pointer-events-none" />

        {/* Linework SVG: Órbita elíptica satelital inclinada */}
        <svg
          className="absolute -inset-8 w-[calc(100%+64px)] h-[calc(100%+64px)] pointer-events-none"
          viewBox="0 0 160 160"
          fill="none"
        >
          <ellipse cx="80" cy="80" rx="66" ry="28" transform="rotate(-24 80 80)" stroke="#93c5fd" strokeWidth="1" strokeDasharray="4 3" opacity="0.65" />
          <circle cx="80" cy="80" r="46" stroke="#bfdbfe" strokeWidth="0.75" strokeDasharray="2 2" opacity="0.45" />
          <circle cx="26" cy="62" r="3" fill="#2563eb" opacity="0.9" />
          <line x1="26" y1="62" x2="14" y2="50" stroke="#60a5fa" strokeWidth="1" strokeDasharray="2 2" opacity="0.7" />
          <line x1="80" y1="26" x2="80" y2="34" stroke="#60a5fa" strokeWidth="1" opacity="0.5" />
          <line x1="80" y1="126" x2="80" y2="134" stroke="#60a5fa" strokeWidth="1" opacity="0.5" />
        </svg>

        <Image
          src="/assets/detail2.png"
          alt="Detalle globo terráqueo con pin"
          width={88}
          height={88}
          className="w-[65px] sm:w-[74px] lg:w-[84px] h-auto object-contain rotate-12 drop-shadow-[0_14px_26px_rgba(37,99,235,0.22)] opacity-90"
        />
      </div>

      {/* Detalle 4: Pin sobre diana de coordenadas (Centro del sector derecho, movido un 10% más a la derecha hacia el borde) */}
      <div className="hidden lg:flex absolute top-[42%] sm:top-[44%] lg:top-[45%] right-[2%] sm:right-[2.5%] lg:right-[3%] xl:right-[3.5%] z-10 pointer-events-none items-center justify-center animate-float-1 transition-transform duration-500 hover:scale-105">
        {/* Resplandor suave */}
        <div className="absolute inset-0 -m-5 rounded-full bg-blue-300/30 blur-xl pointer-events-none" />

        {/* Linework SVG: Diana de radar y retícula de puntería */}
        <svg
          className="absolute -inset-6 w-[calc(100%+48px)] h-[calc(100%+48px)] pointer-events-none"
          viewBox="0 0 140 140"
          fill="none"
        >
          <circle cx="70" cy="70" r="52" stroke="#93c5fd" strokeWidth="1" strokeDasharray="5 3" opacity="0.6" />
          <circle cx="70" cy="70" r="38" stroke="#60a5fa" strokeWidth="1" opacity="0.45" />
          <line x1="70" y1="10" x2="70" y2="130" stroke="#60a5fa" strokeWidth="0.75" strokeDasharray="4 4" opacity="0.4" />
          <line x1="10" y1="70" x2="130" y2="70" stroke="#60a5fa" strokeWidth="0.75" strokeDasharray="4 4" opacity="0.4" />
          <path d="M 28 42 L 28 28 L 42 28" stroke="#2563eb" strokeWidth="1.25" opacity="0.65" />
          <path d="M 112 42 L 112 28 L 98 28" stroke="#2563eb" strokeWidth="1.25" opacity="0.65" />
          <circle cx="98" cy="98" r="2.5" fill="#2563eb" opacity="0.85" />
          <line x1="98" y1="98" x2="114" y2="112" stroke="#60a5fa" strokeWidth="1" strokeDasharray="2 2" opacity="0.7" />
        </svg>

        <Image
          src="/assets/detail4.png"
          alt="Detalle pin de destino"
          width={78}
          height={78}
          className="w-[55px] sm:w-[65px] lg:w-[76px] h-auto object-contain -rotate-12 drop-shadow-[0_10px_18px_rgba(37,99,235,0.18)] opacity-85"
        />
      </div>

      {/* Detalle 6: Mapa con gráficos de análisis (Inferior del sector derecho, subido un 10% más arriba) */}
      <div className="hidden lg:flex absolute bottom-[19%] sm:bottom-[21%] lg:bottom-[22%] right-[34%] sm:right-[38%] lg:right-[41%] xl:right-[43%] z-10 pointer-events-none items-center justify-center animate-float-3 transition-transform duration-500 hover:scale-105">
        {/* Resplandor suave */}
        <div className="absolute inset-0 -m-5 rounded-full bg-blue-300/30 blur-xl pointer-events-none" />

        {/* Linework SVG: Marco de análisis y cuadrícula métrica */}
        <svg
          className="absolute -inset-6 w-[calc(100%+48px)] h-[calc(100%+48px)] pointer-events-none"
          viewBox="0 0 140 140"
          fill="none"
        >
          <rect x="22" y="22" width="96" height="96" rx="8" stroke="#93c5fd" strokeWidth="1" strokeDasharray="4 4" opacity="0.5" />
          <path d="M 18 32 L 18 18 L 32 18" stroke="#2563eb" strokeWidth="1.5" opacity="0.7" />
          <path d="M 122 32 L 122 18 L 108 18" stroke="#2563eb" strokeWidth="1.5" opacity="0.7" />
          <path d="M 18 108 L 18 122 L 32 122" stroke="#2563eb" strokeWidth="1.5" opacity="0.7" />
          <path d="M 122 108 L 122 122 L 108 122" stroke="#2563eb" strokeWidth="1.5" opacity="0.7" />
          <circle cx="96" cy="44" r="2.5" fill="#2563eb" opacity="0.85" />
          <line x1="96" y1="44" x2="112" y2="32" stroke="#60a5fa" strokeWidth="1" strokeDasharray="2 2" opacity="0.7" />
        </svg>

        <Image
          src="/assets/detail6.png"
          alt="Detalle mapa y métricas"
          width={84}
          height={84}
          className="w-[61px] sm:w-[69px] lg:w-[78px] h-auto object-contain rotate-6 drop-shadow-[0_12px_22px_rgba(37,99,235,0.2)] opacity-85"
        />
      </div>

      {/* ── Patrones de Coordenadas Geográficas Sutiles en el Fondo ─────────── */}
      <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_0.75px,transparent_0.75px)] [background-size:32px_32px] opacity-[0.12]" />
    </div>
  );
}

export default AuthBackground;

