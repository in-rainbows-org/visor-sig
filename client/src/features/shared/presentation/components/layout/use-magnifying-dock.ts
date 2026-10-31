"use client";

import { useRef, useState, useCallback } from "react";

export type DockOrientation = "horizontal" | "vertical";

export interface UseMagnifyingDockOptions {
  orientation?: DockOrientation;
  /** Maximum scale factor under cursor (e.g. 1.28) */
  magnify?: number;
  /** Proximity spread: how many neighbor items feel the swell */
  spread?: number;
  /** Lift offset in pixels */
  lift?: number;
  /** Callback fired when an item is selected (used for touch release selection) */
  onSelect?: (index: number) => void;
}

export function useMagnifyingDock({
  orientation = "horizontal",
  magnify = 1.28,
  spread = 0,
  lift = 8,
  onSelect,
}: UseMagnifyingDockOptions = {}) {
  const [hover, setHover] = useState<number | null>(null);
  const barRef = useRef<HTMLElement | null>(null);
  const downRef = useRef(false);
  const choseRef = useRef(false);

  /**
   * Find nearest item index to the given coordinate along the primary axis.
   * We measure actual center coordinates of DOM elements with .dock-item
   * so varying item dimensions don't cause lag or drift.
   */
  const at = useCallback(
    (coord: number) => {
      const items = barRef.current?.querySelectorAll<HTMLElement>(".dock-item");
      if (!items?.length) return null;
      let best = 0;
      let gap = Infinity;
      items.forEach((el, i) => {
        const b = el.getBoundingClientRect();
        const center =
          orientation === "horizontal"
            ? b.left + b.width / 2
            : b.top + b.height / 2;
        const d = Math.abs(coord - center);
        if (d < gap) {
          gap = d;
          best = i;
        }
      });
      return best;
    },
    [orientation]
  );

  const getCoord = useCallback(
    (e: React.PointerEvent) => {
      return orientation === "horizontal" ? e.clientX : e.clientY;
    },
    [orientation]
  );

  const handlePointerDownCapture = useCallback(
    (e: React.PointerEvent) => {
      downRef.current = true;
      choseRef.current = false;
      const index = at(getCoord(e));
      setHover(index);
    },
    [at, getCoord]
  );

  const handlePointerMoveCapture = useCallback(
    (e: React.PointerEvent) => {
      // Mouse magnifies on hover; touch requires finger down
      if (e.pointerType !== "mouse" && !downRef.current) return;
      const index = at(getCoord(e));
      setHover(index);
    },
    [at, getCoord]
  );

  const handlePointerUpCapture = useCallback(
    (e: React.PointerEvent) => {
      if (downRef.current && e.pointerType !== "mouse") {
        const index = at(getCoord(e));
        if (index !== null) {
          choseRef.current = true;
          onSelect?.(index);
        }
      }
      downRef.current = false;
      if (e.pointerType !== "mouse") {
        setHover(null);
      }
    },
    [at, getCoord, onSelect]
  );

  const handlePointerCancelCapture = useCallback(() => {
    downRef.current = false;
    setHover(null);
  }, []);

  const handlePointerLeave = useCallback(() => {
    if (!downRef.current) {
      setHover(null);
    }
  }, []);

  /**
   * Computes scale and lift offset.
   * If spread is 0, only the hovered item (d === 0) lifts and magnifies.
   * Otherwise, uses a raised cosine curve over the spread.
   */
  const getItemTransform = useCallback(
    (index: number) => {
      const d = hover === null ? 99 : Math.abs(index - hover);
      const f =
        spread === 0
          ? d === 0
            ? 1
            : 0
          : d > spread
            ? 0
            : (1 + Math.cos((Math.PI * d) / (spread + 1))) / 2;
      const scale = 1 + (magnify - 1) * f;
      const liftOffset = -lift * f;

      return {
        f,
        scale,
        liftOffset,
        style: {
          transform:
            orientation === "horizontal"
              ? `translateY(${liftOffset}px) scale(${scale})`
              : `translateX(${Math.abs(liftOffset)}px) scale(${scale})`,
        },
      };
    },
    [hover, spread, magnify, lift, orientation]
  );

  return {
    barRef,
    hover,
    choseRef,
    bindBar: {
      ref: barRef,
      onPointerDownCapture: handlePointerDownCapture,
      onPointerMoveCapture: handlePointerMoveCapture,
      onPointerUpCapture: handlePointerUpCapture,
      onPointerCancelCapture: handlePointerCancelCapture,
      onPointerLeave: handlePointerLeave,
    },
    getItemTransform,
  };
}
