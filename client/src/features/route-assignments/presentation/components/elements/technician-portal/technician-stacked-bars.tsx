"use client";

import React, { type CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import { animate, motion, useMotionValue } from "framer-motion";
import type { TechnicianPerformanceBar } from "../../../../domain/entities/technician-dashboard.entity";
import { MOCK_TECHNICIAN_BARS } from "../../../data/mock-technician-dashboard";
import "../stats/stacked-bars.css";

const CH = 150; // Altura sobre la línea base
const BH = 36;  // Altura debajo de la línea base para paradas fallidas
const SEG_GAP = 2;
const LIFT = 2;
const TIP_W = 165;
const SPRING = { type: "spring" as const, stiffness: 380, damping: 34 };

const CATS = ["Completadas", "Pendientes"] as const;

function formatDate(dateStr: string): string {
  try {
    const [year, month, day] = dateStr.split("-");
    const d = new Date(Number(year), Number(month) - 1, Number(day));
    return new Intl.DateTimeFormat("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(d);
  } catch {
    return dateStr;
  }
}

const fmt = (v: number) => Math.round(v).toLocaleString("es-ES");
const sum = (a: number[]) => a.reduce((s, v) => s + v, 0);

export interface TechnicianStackedBarsProps {
  barsData?: TechnicianPerformanceBar[];
  className?: string;
}

export function TechnicianStackedBars({
  barsData = MOCK_TECHNICIAN_BARS,
  className = "",
}: TechnicianStackedBarsProps) {
  const n = Math.max(2, barsData.length);
  const [at, setAt] = useState<number | null>(null);
  const [seen, setSeen] = useState(false);
  const [plotWidth, setPlotWidth] = useState(340);

  const root = useRef<HTMLDivElement | null>(null);
  const plot = useRef<HTMLDivElement | null>(null);

  /* Medir ancho del plot de forma reactiva */
  useEffect(() => {
    if (!plot.current) return;
    const update = () => {
      if (plot.current) {
        const w = plot.current.getBoundingClientRect().width;
        if (w > 0) setPlotWidth(w);
      }
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(plot.current);
    return () => ro.disconnect();
  }, []);

  /* Animación de entrada inicial al observar el componente */
  useEffect(() => {
    const el = root.current;
    if (!el || seen) return;
    if (typeof IntersectionObserver === "undefined") {
      setSeen(true);
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [seen]);

  const data = useMemo(() => {
    return barsData.map((b) => ({
      vals: [b.completedStops, b.pendingStops],
      esc: b.failedStops,
      routeCode: b.routeCode,
      scheduledDate: b.scheduledDate,
      dateFormatted: b.dateFormatted || formatDate(b.scheduledDate),
      completed: b.completedStops,
      pending: b.pendingStops,
      failed: b.failedStops,
    }));
  }, [barsData]);

  const capacity = n;
  const CW = plotWidth;

  const rawBw = (CW - 6 * (capacity - 1)) / capacity;
  const bw = Math.max(7, Math.min(13, rawBw));
  const g = Math.max(2, (CW - bw * capacity) / (capacity - 1));
  const r = Math.min(3.5, bw / 2);

  const totals = data.map((b) => sum(b.vals));
  const maxT = Math.max(...totals, 1);
  const maxE = Math.max(...data.map((b) => b.esc), 1);
  const scale = (CH - LIFT - 2 - SEG_GAP * (CATS.length - 1)) / maxT;

  const layout = data.map((b) => {
    let y = 0;
    const segs = b.vals.map((v) => {
      const h = Math.max(2, v * scale);
      const s = { bottom: y, h };
      y += h + SEG_GAP;
      return s;
    });
    return {
      segs,
      top: y - SEG_GAP,
      esc: Math.max(4, (b.esc / maxE) * (BH - LIFT - 2)),
    };
  });

  /* Cifra total acumulada de paradas procesadas */
  const total = sum(data.map((d) => d.completed + d.failed));
  const [gen, setGen] = useState(0);
  const last = useRef(total);
  useEffect(() => {
    if (last.current === total) return;
    last.current = total;
    setGen((prev) => prev + 1);
  }, [total]);

  /* Ring y Tooltip con animación spring */
  const ringX = useMotionValue(0);
  const ringY = useMotionValue(0);
  const ringH = useMotionValue(0);
  const tipX = useMotionValue(0);
  const was = useRef<number | null>(null);

  useEffect(() => {
    if (at === null || at >= data.length || !layout[at]) {
      was.current = null;
      return;
    }
    const L = layout[at];
    const left = at * (bw + g);
    const ringPad = Math.min(2.5, g / 2);
    const x = left - ringPad;
    const up = seen ? L.top : 0;
    const down = seen ? L.esc : 0;
    const y = CH - LIFT - up - 3;
    const h = up + LIFT + 1 + LIFT + down + 6;

    const right = left + bw + 8;
    const tx =
      right + TIP_W <= CW || left - 8 - TIP_W < 0
        ? Math.min(CW - TIP_W, right)
        : left - 8 - TIP_W;

    const go = (mv: typeof ringX, v: number) => {
      if (was.current === null) mv.set(v);
      else animate(mv, v, SPRING);
    };
    go(ringX, x);
    go(ringY, y);
    go(ringH, h);
    go(tipX, tx);
    was.current = at;
  }, [at, data.length, bw, g, seen, CW]);

  const pick = (e: React.PointerEvent) => {
    const b = plot.current?.getBoundingClientRect();
    if (!b || b.width === 0) return;
    const i = Math.floor(((e.clientX - b.left) / b.width) * capacity);
    if (i >= 0 && i < data.length) {
      setAt(i);
    } else {
      setAt(null);
    }
  };

  const cur = at !== null && at < data.length ? data[at] : null;
  const firstDate = data[0]?.dateFormatted || "—";
  const lastDate = data[data.length - 1]?.dateFormatted || firstDate;

  return (
    <div
      ref={root}
      className={`stb-card rounded-[28px] sm:rounded-[32px] bg-white p-5 sm:p-7 border-0 shadow-none flex flex-col justify-between select-none ${className}`}
      data-colour="on"
      data-scrub={cur ? "" : undefined}
      style={
        {
          ["--stb-r" as string]: `${r}px`,
          ["--stb-rr" as string]: `${r + 3}px`,
        } as CSSProperties
      }
    >
      {/* 1. Cabecera con título a la izquierda y subtítulo a la derecha */}
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
          Rendimiento por asignación
        </h4>
        <span className="text-xs text-slate-500 font-medium">
          Últimas {n} asignaciones
        </span>
      </div>

      {/* 2. Contenido dividido en dos columnas */}
      <div className="flex flex-col sm:flex-row items-center gap-6 lg:gap-8 my-auto w-full">
        {/* Columna Izquierda: Cifra total acumulada */}
        <div className="w-full sm:w-[130px] lg:w-[140px] shrink-0 flex flex-col justify-center">
          <div className="flex flex-col items-start leading-none">
            <span
              className="stb-num text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight"
              aria-label={fmt(total)}
            >
              {fmt(total)
                .split("")
                .map((ch, i) => (
                  <span
                    key={`${gen}-${i}`}
                    className="stb-digit"
                    data-pop={gen > 0 || undefined}
                    style={{ ["--i" as string]: i } as CSSProperties}
                    aria-hidden
                  >
                    {ch}
                  </span>
                ))}
            </span>
            <span className="text-xs sm:text-sm font-semibold text-slate-500 mt-2 leading-snug break-words">
              Paradas procesadas
            </span>
          </div>
        </div>

        {/* Columna Derecha (~70%): Gráfico expandido */}
        <div className="w-full sm:flex-1 min-w-0 flex flex-col justify-center">
          <div
            ref={plot}
            className="stb-plot"
            style={{ height: CH + 1 + BH }}
            onPointerDown={(e) => {
              try {
                e.currentTarget.setPointerCapture(e.pointerId);
              } catch {
                /* scripted */
              }
              pick(e);
            }}
            onPointerMove={pick}
            onPointerUp={(e) => {
              try {
                e.currentTarget.releasePointerCapture(e.pointerId);
              } catch {
                /* scripted */
              }
              if (e.pointerType !== "mouse") setAt(null);
            }}
            onPointerCancel={() => setAt(null)}
            onPointerLeave={() => setAt(null)}
          >
            {/* Línea base */}
            <span className="stb-base" style={{ top: CH }} />

            {/* Columnas del gráfico */}
            {data.map((_, i) => (
              <div
                key={i}
                className="stb-col"
                data-on={at === i || undefined}
                style={
                  {
                    left: i * (bw + g),
                    width: bw,
                    ["--i" as string]: i,
                  } as CSSProperties
                }
              >
                {/* Barras superiores (Completadas + Pendientes) */}
                {layout[i]?.segs.map((s, k) => (
                  <span
                    key={k}
                    className="stb-bar"
                    style={
                      {
                        ["--c" as string]: `var(--stb-c${k + 1})`,
                        bottom: BH + 1 + LIFT + (seen ? s.bottom : 0),
                        height: seen ? s.h : 0,
                      } as CSSProperties
                    }
                  />
                ))}

                {/* Barra inferior (Fallidas / Observadas) */}
                <span
                  className="stb-esc"
                  style={{
                    top: CH + 1 + LIFT,
                    height: seen ? layout[i]?.esc : 0,
                  }}
                />
              </div>
            ))}

            {/* Anillo de enfoque elástico */}
            <motion.span
              className="stb-ring"
              aria-hidden
              style={{
                x: ringX,
                y: ringY,
                height: ringH,
                width: bw + Math.min(2.5, g / 2) * 2,
              }}
            />

            {/* Popover / Tooltip interactivo con código de ruta y conteos */}
            <motion.div
              className="stb-tip"
              style={{ x: tipX, width: TIP_W }}
              aria-hidden={!cur}
            >
              {cur && (
                <div className="flex flex-col gap-1.5">
                  <div>
                    <span className="text-xs font-bold text-slate-900 leading-tight block truncate">
                      {cur.routeCode}
                    </span>
                    <span className="text-[11px] font-medium text-slate-500 leading-tight block truncate">
                      {cur.dateFormatted}
                    </span>
                  </div>

                  <div className="pt-1.5 border-t border-slate-100 space-y-1">
                    <div className="flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="size-2 rounded-full bg-[#4ba1fe] shrink-0" />
                        <span className="text-slate-600 font-medium">Completadas</span>
                      </div>
                      <b className="font-mono text-slate-900 font-semibold">{cur.completed}</b>
                    </div>

                    <div className="flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="size-2 rounded-full bg-[#fdd94f] shrink-0" />
                        <span className="text-slate-600 font-medium">Pendientes</span>
                      </div>
                      <b className="font-mono text-slate-900 font-semibold">{cur.pending}</b>
                    </div>

                    <div className="flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="size-2 rounded-full bg-[#ef4444] shrink-0" />
                        <span className="text-slate-600 font-medium">Fallidas</span>
                      </div>
                      <b className="font-mono text-slate-900 font-semibold">{cur.failed}</b>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>

          {/* Eje inferior con rango de fechas */}
          <div className="stb-axis mt-3 flex justify-between text-[11px] font-semibold text-slate-700 font-mono">
            <span>{firstDate}</span>
            <span>{lastDate}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
