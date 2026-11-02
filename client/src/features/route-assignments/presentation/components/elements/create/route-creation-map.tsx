"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  useMap,
  useMapEvents,
} from "react-leaflet";
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
  calculatedCoordinates,
  onRegisterZoom,
}: {
  selectedCandidate: FixedCodeCandidate | null | undefined;
  lastAddedStop: RouteCartStop | null;
  calculatedCoordinates?: [number, number][];
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

  // Encuadrar la polilínea completa de la ruta calculada por OSRM
  useEffect(() => {
    if (!calculatedCoordinates || calculatedCoordinates.length < 2) return;
    map.fitBounds(L.latLngBounds(calculatedCoordinates), {
      padding: [48, 48],
      animate: true,
      maxZoom: 16,
    });
  }, [calculatedCoordinates, map]);

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
// Banderita 3D con pedestal/base en la parte inferior izquierda:
// - Centro horizontal de la base y mástil: x ≈ 31.9% del ancho (13.5px de 42px)
// - Centro del pedestal elíptico en el suelo: y ≈ 93% del alto (46.5px de 50px)
const START_POINT_SIZE: [number, number] = [42, 50];
const START_POINT_ANCHOR: [number, number] = [13.5, 46.5];

let cachedStartingIcon: L.Icon | null = null;

function getStartingPinIcon(): L.Icon {
  if (cachedStartingIcon) return cachedStartingIcon;
  cachedStartingIcon = L.icon({
    iconUrl: "/navigation-map/start-point.webp",
    iconSize: START_POINT_SIZE,
    iconAnchor: START_POINT_ANCHOR,
    popupAnchor: [0, -46.5],
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

// Subcomponente de polilínea animada que dibuja el avance progresivo de la ruta vial
function AnimatedRoutePolyline({
  coordinates,
}: {
  coordinates: [number, number][];
}) {
  const [animatedCoords, setAnimatedCoords] = useState<[number, number][]>([]);
  const animFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (!coordinates || coordinates.length < 2) {
      setAnimatedCoords(coordinates || []);
      return;
    }

    // Inicializar con los dos primeros puntos idénticos para inicio suave
    setAnimatedCoords([coordinates[0], coordinates[0]]);
    startTimeRef.current = null;

    const totalPoints = coordinates.length;
    // Duración suave y fluida (20% más pausada): entre 1200ms y 1800ms según la densidad de puntos
    const durationMs = Math.min(1800, Math.max(1200, totalPoints * 12));

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(1, elapsed / durationMs);

      // Curva cúbica para inicio ágil y desaceleración elegante al final
      const ease = 1 - Math.pow(1 - progress, 3);
      const floatIndex = ease * (totalPoints - 1);
      const baseIndex = Math.floor(floatIndex);
      const fraction = floatIndex - baseIndex;

      if (baseIndex >= totalPoints - 1) {
        setAnimatedCoords(coordinates);
        return;
      }

      const p1 = coordinates[baseIndex];
      const p2 = coordinates[baseIndex + 1];

      // Interpolación lineal precisa del punto de avance (cabeza del trazo)
      const currentHead: [number, number] = [
        p1[0] + (p2[0] - p1[0]) * fraction,
        p1[1] + (p2[1] - p1[1]) * fraction,
      ];

      const currentSegment = [...coordinates.slice(0, baseIndex + 1), currentHead];
      setAnimatedCoords(currentSegment);

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [coordinates]);

  if (!coordinates || coordinates.length < 2) return null;

  return (
    <>
      {/* 1. Silueta tenue de fondo para mostrar el corredor vial completo */}
      <Polyline
        positions={coordinates}
        pathOptions={{
          color: "#0e4dcb",
          weight: 4,
          opacity: 0.18,
          lineCap: "round",
          lineJoin: "round",
        }}
      />
      {/* 2. Trazado vial activo en avance progresivo con azul vibrante */}
      {animatedCoords.length >= 2 && (
        <Polyline
          positions={animatedCoords}
          pathOptions={{
            color: "#0e4dcb",
            weight: 5,
            opacity: 0.9,
            lineCap: "round",
            lineJoin: "round",
          }}
        />
      )}
    </>
  );
}

export function RouteCreationMap({
  selectedCandidate,
  className = "",
}: RouteCreationMapProps) {
  const {
    currentStep,
    startingPoint,
    setStartingPoint,
    cartStops,
    calculatedRoute,
  } = useRouteCreationWizard();

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
          calculatedCoordinates={calculatedRoute?.coordinates}
          onRegisterZoom={handleRegisterZoom}
        />

        {/* Captura de clic para Punto de Partida (Paso 2) */}
        <MapStartingPointPicker
          isActive={isStartingPointStep}
          onPickStartingPoint={setStartingPoint}
        />

        {/* Trazado Vial Animado con Avance Progresivo */}
        {calculatedRoute?.coordinates && calculatedRoute.coordinates.length > 0 && (
          <AnimatedRoutePolyline coordinates={calculatedRoute.coordinates} />
        )}

        {/* Marcador del Punto de Partida (sin popover) */}
        {startingPoint && (
          <Marker
            position={[startingPoint.latitude, startingPoint.longitude]}
            icon={getStartingPinIcon()}
          />
        )}

        {/* Marcadores numerados del Carrito de Paradas (sin popover) */}
        {cartStops.map((stop) => {
          const icon = getStopCartPinIcon(stop.orderIndex);

          return (
            <Marker
              key={`stop-${stop.id}-${stop.orderIndex}`}
              position={[stop.latitude, stop.longitude]}
              icon={icon}
            />
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
