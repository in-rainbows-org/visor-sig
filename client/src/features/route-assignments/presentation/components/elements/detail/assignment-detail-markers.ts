import L from "leaflet";
import type { AssignmentStopStatus } from "../../../../domain/entities/assignment-detail.entity";

const START_POINT_SIZE: [number, number] = [42, 50];
const START_POINT_ANCHOR: [number, number] = [13.5, 46.5];

let cachedStartingIcon: L.Icon | null = null;
let cachedSelectedStartingIcon: L.DivIcon | null = null;

/**
 * Ícono oficial del punto de partida (/navigation-map/start-point.webp)
 * Idéntico al configurado en route-creation-map.tsx
 */
export function getDetailStartingPinIcon(isSelected: boolean = false): L.Icon | L.DivIcon {
  if (isSelected) {
    if (cachedSelectedStartingIcon) return cachedSelectedStartingIcon;
    cachedSelectedStartingIcon = L.divIcon({
      className: "route-start-point-div-icon !bg-transparent !border-0",
      iconSize: START_POINT_SIZE,
      iconAnchor: START_POINT_ANCHOR,
      popupAnchor: [0, -46.5],
      html: `
        <div style="position: relative; width: 42px; height: 50px; user-select: none; transform: scale(1.12); filter: drop-shadow(0 4px 10px rgba(14, 77, 203, 0.5)); transform-origin: 13.5px 46.5px; transition: transform 0.2s ease;">
          <img
            src="/navigation-map/start-point.webp"
            alt="Punto de partida"
            style="width: 42px; height: 50px; display: block; pointer-events: none;"
          />
        </div>
      `,
    });
    return cachedSelectedStartingIcon;
  }

  if (cachedStartingIcon) return cachedStartingIcon;
  cachedStartingIcon = L.icon({
    iconUrl: "/navigation-map/start-point.webp",
    iconSize: START_POINT_SIZE,
    iconAnchor: START_POINT_ANCHOR,
    popupAnchor: [0, -46.5],
    className: "route-start-point-pin cursor-pointer",
  });
  return cachedStartingIcon;
}

const STOP_POINT_SIZE: [number, number] = [42, 51.5];
const STOP_POINT_ANCHOR: [number, number] = [21, 51.5];

const stopIconCache = new Map<string, L.DivIcon>();

/**
 * Ícono oficial de parada:
 * - COMPLETED: /navigation-map/completed-stop.webp (sin número)
 * - FAILED: /navigation-map/failed-stop.webp (sin número)
 * - PENDING / IN_TRANSIT / ARRIVED: /navigation-map/stop-point.webp con número de orden
 */
export function getDetailStopPinIcon(
  orderIndex: number,
  status: AssignmentStopStatus = "PENDING",
  isSelected: boolean = false
): L.DivIcon {
  const isCompleted = status === "COMPLETED";
  const isFailed = status === "FAILED";

  const cacheKey = `${status}-${isCompleted || isFailed ? "" : orderIndex}-${isSelected}`;
  const existing = stopIconCache.get(cacheKey);
  if (existing) return existing;

  // 1. Estado COMPLETADA o FALLIDA: icono específico sin número
  if (isCompleted || isFailed) {
    const imgSrc = isCompleted
      ? "/navigation-map/completed-stop.webp"
      : "/navigation-map/failed-stop.webp";
    const altText = isCompleted
      ? `Parada ${orderIndex} - Completada`
      : `Parada ${orderIndex} - Fallida`;

    const glowColor = isCompleted
      ? "rgba(16, 185, 129, 0.55)"
      : "rgba(239, 68, 68, 0.55)";

    const selectedStyle = isSelected
      ? `transform: scale(1.14); filter: drop-shadow(0 6px 12px ${glowColor}); transform-origin: 21px 51.5px; z-index: 9999;`
      : "filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.15));";

    const icon = L.divIcon({
      className: `route-stop-cart-div-icon !bg-transparent !border-0 cursor-pointer ${
        isCompleted ? "stop-completed-pin" : "stop-failed-pin"
      }`,
      iconSize: STOP_POINT_SIZE,
      iconAnchor: STOP_POINT_ANCHOR,
      popupAnchor: [0, -51.5],
      html: `
        <div style="position: relative; width: 42px; height: 51.5px; user-select: none; transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1); ${selectedStyle}">
          <img
            src="${imgSrc}"
            alt="${altText}"
            style="width: 42px; height: 51.5px; display: block; pointer-events: none; object-fit: contain;"
          />
        </div>
      `,
    });

    stopIconCache.set(cacheKey, icon);
    return icon;
  }

  // 2. Otros estados (PENDING, IN_TRANSIT, ARRIVED): Pin azul con número de orden
  const fontSize = orderIndex >= 100 ? "10px" : orderIndex >= 10 ? "12px" : "13.5px";
  const selectedStyle = isSelected
    ? "transform: scale(1.14); filter: drop-shadow(0 6px 12px rgba(14, 77, 203, 0.5)); transform-origin: 21px 51.5px; z-index: 9999;"
    : "filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.15));";

  const icon = L.divIcon({
    className: "route-stop-cart-div-icon !bg-transparent !border-0 cursor-pointer",
    iconSize: STOP_POINT_SIZE,
    iconAnchor: STOP_POINT_ANCHOR,
    popupAnchor: [0, -51.5],
    html: `
      <div style="position: relative; width: 42px; height: 51.5px; user-select: none; transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1); ${selectedStyle}">
        <img
          src="/navigation-map/stop-point.webp"
          alt="Parada ${orderIndex}"
          style="width: 42px; height: 51.5px; display: block; pointer-events: none;"
        />
        <span
          style="
            position: absolute;
            top: 44.5%;
            left: 49%;
            transform: translate(-50%, -50%);
            font-family: var(--font-montserrat, Montserrat, sans-serif);
            font-weight: 800;
            color: #0e4dcb;
            font-size: ${fontSize};
            line-height: 1;
            text-align: center;
            pointer-events: none;
            letter-spacing: -0.5px;
          "
        >
          ${orderIndex}
        </span>
      </div>
    `,
  });

  stopIconCache.set(cacheKey, icon);
  return icon;
}
