import { MapPin } from "lucide-react";

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

      {/* ── Geometría Izquierda: Radar & Dotted Flight-Path Geometry ──────────── */}
      <div className="absolute left-[20%] sm:left-[22%] lg:left-[25%] top-[14%] sm:top-[16%] w-[320px] h-[480px] pointer-events-none z-10 hidden sm:block">
        <svg className="w-full h-full overflow-visible" fill="none" viewBox="0 0 320 480">
          <circle
            cx="160"
            cy="120"
            opacity="0.75"
            r="105"
            stroke="#93c5fd"
            strokeDasharray="4 4"
            strokeWidth="1.2"
          />
          <circle
            cx="160"
            cy="120"
            opacity="0.5"
            r="75"
            stroke="#93c5fd"
            strokeWidth="1"
          />
          <circle
            cx="160"
            cy="120"
            opacity="0.6"
            r="45"
            stroke="#bfdbfe"
            strokeWidth="1"
          />
          <path
            d="M 160 160 C 175 220, 182 280, 168 340 C 150 410, 100 480, -40 540"
            opacity="0.75"
            stroke="#60a5fa"
            strokeDasharray="4 5"
            strokeWidth="1.6"
          />
        </svg>

        {/* Pin Circular Flotante Izquierdo */}
        <div className="absolute top-[80px] left-[120px] w-20 h-20 bg-white rounded-full shadow-[0_12px_30px_rgba(37,99,235,0.18)] flex items-center justify-center border border-blue-50 transition-transform duration-300">
          <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-600/30">
            <MapPin className="size-6 text-white fill-white" />
          </div>
        </div>
      </div>

      {/* ── Geometría Derecha: Radar & Dotted Flight-Path Geometry (Debajo de la carta derecha) ─── */}
      <div className="absolute right-[3%] top-[14%] sm:top-[16%] w-[320px] h-[480px] pointer-events-none z-10 hidden sm:block">
        <svg className="w-full h-full overflow-visible" fill="none" viewBox="0 0 320 480">
          <circle
            cx="160"
            cy="120"
            opacity="0.75"
            r="105"
            stroke="#93c5fd"
            strokeDasharray="4 4"
            strokeWidth="1.2"
          />
          <circle
            cx="160"
            cy="120"
            opacity="0.5"
            r="75"
            stroke="#93c5fd"
            strokeWidth="1"
          />
          <circle
            cx="160"
            cy="120"
            opacity="0.6"
            r="45"
            stroke="#bfdbfe"
            strokeWidth="1"
          />
          <path
            d="M 160 160 C 145 220, 138 280, 152 340 C 170 410, 220 480, 360 540"
            opacity="0.75"
            stroke="#60a5fa"
            strokeDasharray="4 5"
            strokeWidth="1.6"
          />
        </svg>

        {/* Pin Circular Flotante Derecho */}
        <div className="absolute top-[80px] right-[120px] w-20 h-20 bg-white rounded-full shadow-[0_12px_30px_rgba(37,99,235,0.18)] flex items-center justify-center border border-blue-50 transition-transform duration-300">
          <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-600/30">
            <MapPin className="size-6 text-white fill-white" />
          </div>
        </div>
      </div>

      {/* ── Patrones de Coordenadas Geográficas Sutiles en el Fondo ─────────── */}
      <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_0.75px,transparent_0.75px)] [background-size:32px_32px] opacity-[0.12]" />
    </div>
  );
}

export default AuthBackground;
