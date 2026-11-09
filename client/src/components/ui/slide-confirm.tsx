"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

const PAD = 4;
const HOLD = 1500;
const MIN_SPAN = 180;
const MAX_SPAN = 500;
const DEFAULT_SPEED = 50;

export interface SlideConfirmProps {
  onConfirm?: () => void | Promise<void>;
  text?: string;
  confirmedText?: string;
  width?: number;
  height?: number;
  corner?: number;
  speed?: number;
  className?: string;
  variant?: "emerald" | "blue" | "dark" | "default";
  disabled?: boolean;
  resetAfterConfirm?: boolean;
}

export function SlideConfirm({
  onConfirm,
  text = "Desliza para confirmar",
  confirmedText = "Asignación confirmada",
  width,
  height = 49,
  corner,
  speed = DEFAULT_SPEED,
  className = "",
  variant = "emerald",
  disabled = false,
  resetAfterConfirm = false,
}: SlideConfirmProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [measuredWidth, setMeasuredWidth] = useState<number>(width ?? 280);

  const [done, setDone] = useState(false);
  const [held, setHeld] = useState(false);

  const track = useRef<HTMLDivElement | null>(null);
  const grip = useRef<{ id: number; grab: number | null; moved: boolean } | null>(null);
  const beat = useRef<number | null>(null);

  // ResizeObserver to automatically adapt to container width if width prop is not provided
  useEffect(() => {
    if (typeof width === "number") {
      setMeasuredWidth(width);
      return;
    }

    const el = containerRef.current;
    if (!el) return;

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        if (w > 0) {
          setMeasuredWidth(w);
        }
      }
    });

    ro.observe(el);
    return () => ro.disconnect();
  }, [width]);

  const x = useMotionValue(0);
  const anchor = useMotionValue(0);
  const pulse = useMotionValue(1);
  const shown = useMotionValue(1);

  const H = height;
  const GRIP = H - PAD * 2;
  const CORNER = H / 2;

  const span = clamp(Math.round(measuredWidth), MIN_SPAN, MAX_SPAN);
  const TRAVEL = Math.max(1, span - PAD * 2 - GRIP);

  const r = clamp(corner ?? CORNER, 0, CORNER);
  const gripR = Math.max(0, r - PAD);
  const mark = TRAVEL;

  const stiff = 260 + (clamp(speed, 0, 100) / 100) * 640;
  const spring = {
    type: "spring" as const,
    stiffness: stiff,
    damping: 2 * Math.sqrt(stiff * 0.9),
    mass: 0.9,
  };
  const home = { ...spring, damping: 2 * Math.sqrt(stiff * 0.9) * 0.62 };

  const loose = useRef<(() => void) | null>(null);
  const live = useRef<{
    move: (e: PointerEvent) => void;
    up: (e: PointerEvent) => void;
  }>({ move: () => {}, up: () => {} });

  const watch = useCallback(() => {
    loose.current?.();
    const onMove = (e: PointerEvent) => live.current.move(e);
    const onUp = (e: PointerEvent) => {
      live.current.up(e);
      loose.current?.();
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    loose.current = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      loose.current = null;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (beat.current) window.clearTimeout(beat.current);
      loose.current?.();
    };
  }, []);

  const seen = useTransform(x, (v) => clamp(v, 0, TRAVEL));
  const wide = useTransform([seen, anchor], ([v, a]: number[]) =>
    GRIP + clamp(a - v, 0, TRAVEL)
  );

  // La barra que va progresando está a la par con la cabeza (v + GRIP) pero por detrás
  const wash = useTransform([seen, shown], ([v, s]: number[]) =>
    s === 0 ? span - PAD * 2 : v + GRIP
  );
  const say = useTransform(seen, [0, TRAVEL * 0.55], [1, 0]);
  const arrow = useTransform([seen, shown], ([v, on]: number[]) =>
    on * clamp(1 - (v - TRAVEL * 0.55) / (TRAVEL * 0.4), 0, 1)
  );

  // Variant color definitions sin sombras y con degradados limpios
  const variantStyles = {
    emerald: {
      track: "bg-slate-100/90 shadow-none border-0",
      wash: "bg-[#16a34a]",
      doneBg: "bg-[#16a34a] text-white shadow-none border-0",
      say: "text-slate-500 font-semibold",
      done: "text-white font-bold",
    },
    blue: {
      track: "bg-slate-100/90 shadow-none border-0",
      wash: "bg-gradient-to-r from-[#0e4dcb] via-[#1a66e5] to-[#2579f6]",
      doneBg: "bg-gradient-to-r from-[#0e4dcb] via-[#1a66e5] to-[#2579f6] text-white shadow-none border-0",
      say: "text-slate-500 font-semibold",
      done: "text-white font-bold",
    },
    dark: {
      track: "bg-slate-200 shadow-none border-0",
      wash: "bg-slate-900",
      doneBg: "bg-slate-900 text-white shadow-none border-0",
      say: "text-slate-600 font-semibold",
      done: "text-white font-bold",
    },
    default: {
      track: "bg-slate-100/90 shadow-none border-0",
      wash: "bg-slate-800",
      doneBg: "bg-slate-800 text-white shadow-none border-0",
      say: "text-slate-500 font-semibold",
      done: "text-white font-bold",
    },
  }[variant];

  const local = useCallback(
    (clientX: number) => {
      const box = track.current?.getBoundingClientRect();
      if (!box) return 0;
      const k = box.width / span;
      return (clientX - box.left) / (k || 1);
    },
    [span]
  );

  const finish = useCallback(() => {
    setDone(true);
    anchor.set(x.get());
    animate(shown, 0, { duration: 0.16 });
    animate(x, 0, spring);
    animate(pulse, [1, 0.974, 1], {
      duration: 0.42,
      times: [0, 0.62, 1],
      ease: [0.33, 0.55, 0.2, 1],
      delay: 0.1,
    });

    // Callback on commit settled
    window.setTimeout(() => {
      onConfirm?.();
    }, 550);

    beat.current = window.setTimeout(() => {
      if (resetAfterConfirm) {
        setDone(false);
        animate(shown, 1, { duration: 0.22, delay: 0.12 });
        animate(anchor, 0, { type: "spring", stiffness: 380, damping: 34, mass: 0.9 });
      }
    }, HOLD);
  }, [anchor, onConfirm, resetAfterConfirm, shown, spring, pulse, x]);

  const down = useCallback(
    (e: React.PointerEvent) => {
      if (done || disabled) return;
      e.stopPropagation();
      grip.current = { id: e.pointerId, grab: null, moved: false };
      setHeld(true);
      try {
        track.current?.setPointerCapture(e.pointerId);
      } catch {
        /* synthetic */
      }
      watch();
    },
    [disabled, done, watch]
  );

  const move = useCallback(
    (e: PointerEvent | React.PointerEvent) => {
      const g = grip.current;
      if (!g || g.id !== e.pointerId) return;
      const at = local(e.clientX);
      if (g.grab === null) {
        g.grab = at - x.get();
        return;
      }
      const next = clamp(at - g.grab, 0, TRAVEL);
      if (Math.abs(next - x.get()) > 0.5) g.moved = true;
      x.set(next);
    },
    [local, TRAVEL, x]
  );

  const up = useCallback(
    (e: PointerEvent | React.PointerEvent) => {
      const g = grip.current;
      if (!g) return;
      grip.current = null;
      try {
        track.current?.releasePointerCapture?.(e.pointerId);
      } catch {
        /* never captured */
      }
      setHeld(false);
      if (x.get() >= mark) {
        finish();
      } else {
        animate(x, 0, home);
      }
    },
    [finish, home, mark, x]
  );

  live.current = { move, up };

  return (
    <div
      ref={containerRef}
      className={`relative select-none shadow-none ${className}`}
      style={{
        width: typeof width === "number" ? width : "100%",
        height: H,
        minWidth: MIN_SPAN,
        maxWidth: MAX_SPAN,
      }}
    >
      <motion.div
        ref={track}
        className={`relative w-full h-full select-none touch-none overflow-hidden transition-colors shadow-none border-0 ${variantStyles.track} ${
          disabled ? "opacity-50 cursor-not-allowed" : ""
        }`}
        style={{
          borderRadius: r,
          scale: pulse,
        }}
        data-held={held || undefined}
        data-done={done || undefined}
        onPointerDown={down}
      >
        {/* Ground covered by handle */}
        <motion.i
          className={`absolute left-[4px] top-[4px] bottom-[4px] z-[1] pointer-events-none shadow-none ${variantStyles.wash}`}
          aria-hidden="true"
          style={{
            width: wash,
            borderRadius: gripR,
          }}
        />

        {/* Central label */}
        <motion.span
          className={`absolute inset-0 flex items-center justify-center font-medium text-xs tracking-tight pointer-events-none select-none z-0 ${variantStyles.say}`}
          style={{ opacity: say }}
        >
          {text}
        </motion.span>

        {/* Morphing Grip Button */}
        <motion.button
          type="button"
          disabled={disabled}
          className={`absolute left-[4px] top-[4px] border-0 p-0 z-[2] flex items-center justify-center transition-none outline-none shadow-none ${
            done ? variantStyles.doneBg : "bg-transparent"
          } ${held ? "cursor-grabbing" : "cursor-grab"}`}
          style={{
            height: GRIP,
            x: seen,
            width: wide,
            borderRadius: gripR,
            transformOrigin: "0% 50%",
          }}
          transition={{ type: "spring", stiffness: 380, damping: 34, mass: 0.7 }}
          aria-label={done ? confirmedText : text}
        >
          {/* Flecha blanca que va en la cabeza de la barra de progreso */}
          <motion.span
            className="absolute inset-0 flex items-center justify-center pointer-events-none text-white"
            style={{ opacity: arrow }}
            aria-hidden="true"
          >
            <ArrowRight className="size-5 stroke-[2.8]" />
          </motion.span>

          {/* Confirmed State with Checkmark */}
          <motion.span
            className={`absolute inset-0 flex items-center justify-center gap-1.5 font-bold text-xs tracking-tight pointer-events-none ${variantStyles.done}`}
            aria-hidden="true"
            initial={false}
            animate={{ opacity: done ? 1 : 0, scale: done ? 1 : 0.8 }}
            transition={{ duration: 0.16, ease: [0.33, 0.55, 0.2, 1] }}
          >
            <Check className="size-4 stroke-[3]" />
            <span>{confirmedText}</span>
          </motion.span>
        </motion.button>
      </motion.div>
    </div>
  );
}

export default SlideConfirm;
