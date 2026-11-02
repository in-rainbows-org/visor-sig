"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import type { FixedCodeCandidate } from "@/features/route-assignments/domain/entities/fixed-code-candidate.entity";
import { RouteCreationZoomControls } from "./route-creation-zoom-controls";
import { useRouteCreationWizard } from "@/features/route-assignments/presentation/state/route-creation-wizard-store";
import { RouteWizardStep, type RouteCartStop } from "@/features/route-assignments/domain/entities/route-wizard.entity";

// Coordenadas por defecto en Santa Cruz de la Sierra, Bolivia
export const SANTA_CRUZ_DEFAULT_CENTER: [number, number] = [-17.7833, -63.1821];
export const SANTA_CRUZ_DEFAULT_ZOOM = 13;

export type RouteCreationMapProps = {
  selectedCandidate?: FixedCodeCandidate | null;
  addedCandidates?: FixedCodeCandidate[];
  onSelectCandidate?: (candidate: FixedCodeCandidate) => void;
  onAddCandidate?: (candidate: FixedCodeCandidate) => void;
  className?: string;
};

// Controlador interno de mapa para enfocar y proveer zoom
function MapController({
  selectedCandidate,
  lastAddedStop,
  onRegisterZoom,
}: {
  selectedCandidate: FixedCodeCandidate | null | undefined;
  lastAddedStop: RouteCartStop | null;
  onRegisterZoom: (zoomIn: () => void, zoomOut: () => void) => void;
}) {
  const map = useMap();

  // Invalida el tamaño en el montaje para erradicar fondos grises en Next.js
  useEffect(() => {
    map.invalidateSize();
    const t1 = setTimeout(() => map.invalidateSize(), 100);
    const t2 = setTimeout(() => map.invalidateSize(), 400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [map]);

  useEffect(() => {
    onRegisterZoom(
      () => map.zoomIn(),
      () => map.zoomOut()
    );
  }, [map, onRegisterZoom]);

  // Enfocar suavemente a la parada seleccionada en el buscador
  useEffect(() => {
    if (!selectedCandidate) return;
    const { latitude, longitude } = selectedCandidate;
    if (isNaN(latitude) || isNaN(longitude)) return;

    map.flyTo([latitude, longitude], 17, {
      animate: true,
      duration: 0.8,
    });
  }, [selectedCandidate, map]);

  // Enfocar dinámicamente a la última casa agregada al carrito
  useEffect(() => {
    if (!lastAddedStop) return;
    const { latitude, longitude } = lastAddedStop;
    if (isNaN(latitude) || isNaN(longitude)) return;

    map.flyTo([latitude, longitude], 17, {
      animate: true,
      duration: 0.8,
    });
  }, [lastAddedStop, map]);

  return null;
}

// Escucha de clics en el mapa para el Paso 2 (Punto de partida)
function MapStartingPointPicker({
  isActive,
  onPickStartingPoint,
}: {
  isActive: boolean;
  onPickStartingPoint: (coords: { latitude: number; longitude: number }) => void;
}) {
  useMapEvents({
    click(e) {
      if (!isActive) return;
      onPickStartingPoint({
        latitude: e.latlng.lat,
        longitude: e.latlng.lng,
      });
    },
  });
  return null;
}

// Configuración y cache del ícono del Punto de Partida (start-point.webp)
// Imagen centrada: la coordenada queda en el centro geométrico de la imagen
const START_POINT_SIZE: [number, number] = [42, 50];
const START_POINT_ANCHOR: [number, number] = [21, 25];

let cachedStartingIcon: L.Icon | null = null;

function getStartingPinIcon(): L.Icon {
  if (cachedStartingIcon) return cachedStartingIcon;
  cachedStartingIcon = L.icon({
    iconUrl: "/navigation-map/start-point.webp",
    iconSize: START_POINT_SIZE,
    iconAnchor: START_POINT_ANCHOR,
    popupAnchor: [0, -25],
    className: "route-start-point-pin",
  });
  return cachedStartingIcon;
}

// Configuración y cache de íconos numerados de paradas (stop-point.webp)
// Coordenada situada en la parte inferior centrada (punta del pin)
const STOP_POINT_SIZE: [number, number] = [42, 51.5];
const STOP_POINT_ANCHOR: [number, number] = [21, 51.5];

const stopIconCache = new Map<number, L.DivIcon>();

function getStopCartPinIcon(orderIndex: number): L.DivIcon {
  const existing = stopIconCache.get(orderIndex);
  if (existing) return existing;

  const fontSize = orderIndex >= 100 ? "10px" : orderIndex >= 10 ? "12px" : "13.5px";

  const icon = L.divIcon({
    className: "route-stop-cart-div-icon !bg-transparent !border-0",
    iconSize: STOP_POINT_SIZE,
    iconAnchor: STOP_POINT_ANCHOR,
    popupAnchor: [0, -51.5],
    html: `
      <div style="position: relative; width: 42px; height: 51.5px; user-select: none;">
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

  stopIconCache.set(orderIndex, icon);
  return icon;
}

export function RouteCreationMap({
  selectedCandidate,
  className = "",
}: RouteCreationMapProps) {
  const { currentStep, startingPoint, setStartingPoint, cartStops, removeStop } =
    useRouteCreationWizard();

  const [lastAddedStop, setLastAddedStop] = useState<RouteCartStop | null>(null);
  const prevStopsCountRef = useRef(cartStops.length);

  // Detectar nueva casa agregada para enfocar el mapa
  useEffect(() => {
    if (cartStops.length > prevStopsCountRef.current) {
      const latest = cartStops[cartStops.length - 1];
      setLastAddedStop(latest);
    }
    prevStopsCountRef.current = cartStops.length;
  }, [cartStops]);

  const zoomInRef = useRef<() => void>(() => {});
  const zoomOutRef = useRef<() => void>(() => {});

  const handleRegisterZoom = (zIn: () => void, zOut: () => void) => {
    zoomInRef.current = zIn;
    zoomOutRef.current = zOut;
  };

  const isStartingPointStep = currentStep === RouteWizardStep.STARTING_POINT;

  return (
    <div
      className={`relative w-full h-full overflow-hidden ${
        isStartingPointStep ? "cursor-crosshair" : ""
      } ${className}`}
    >
      <MapContainer
        center={
          selectedCandidate
            ? [selectedCandidate.latitude, selectedCandidate.longitude]
            : SANTA_CRUZ_DEFAULT_CENTER
        }
        zoom={selectedCandidate ? 17 : SANTA_CRUZ_DEFAULT_ZOOM}
        zoomControl={false}
        attributionControl={false}
        preferCanvas={true}
        className="w-full h-full z-0"
      >
        {/* Capa Base Oficial: OpenStreetMap */}
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
          subdomains={["a", "b", "c"]}
          attribution="&copy; OpenStreetMap contributors"
        />

        <MapController
          selectedCandidate={selectedCandidate}
          lastAddedStop={lastAddedStop}
          onRegisterZoom={handleRegisterZoom}
        />

        {/* Captura de clic para Punto de Partida (Paso 2) */}
        <MapStartingPointPicker
          isActive={isStartingPointStep}
          onPickStartingPoint={setStartingPoint}
        />

        {/* Marcador del Punto de Partida */}
        {startingPoint && (
          <Marker
            position={[startingPoint.latitude, startingPoint.longitude]}
            icon={getStartingPinIcon()}
          >
            <Popup className="route-candidate-popup" closeButton={false}>
              <div className="p-2 space-y-1 text-xs font-sans min-w-[140px]">
                <p className="font-bold text-blue-700">Punto de Partida</p>
                <p className="text-[10px] text-slate-500 font-mono">
                  {startingPoint.latitude.toFixed(5)}, {startingPoint.longitude.toFixed(5)}
                </p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Marcadores numerados del Carrito de Paradas */}
        {cartStops.map((stop) => {
          const icon = getStopCartPinIcon(stop.orderIndex);

          return (
            <Marker
              key={stop.id}
              position={[stop.latitude, stop.longitude]}
              icon={icon}
            >
              <Popup className="route-candidate-popup" closeButton={false}>
                <div className="p-2 space-y-1.5 text-xs font-sans min-w-[160px]">
                  <div className="flex items-center justify-between gap-2 border-b pb-1">
                    <span className="font-bold text-slate-900 text-sm">
                      #{stop.fixedCode}
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
                      Parada {stop.orderIndex}
                    </span>
                  </div>
                  <p className="text-slate-600 font-medium truncate">
                    {stop.name || "Sin titular"}
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono">
                    {stop.latitude.toFixed(5)}, {stop.longitude.toFixed(5)}
                  </p>
                  <button
                    type="button"
                    onClick={() => removeStop(stop.id)}
                    className="w-full mt-1.5 py-1 px-2.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 transition cursor-pointer"
                  >
                    Quitar de la ruta
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Controles Flotantes de Zoom (+ y -) */}
      <div className="absolute bottom-20 sm:bottom-24 lg:bottom-6 lg:right-6 right-4 z-[1000] pointer-events-auto">
        <RouteCreationZoomControls
          onZoomIn={() => zoomInRef.current()}
          onZoomOut={() => zoomOutRef.current()}
        />
      </div>
    </div>
  );
}

export default RouteCreationMap;
