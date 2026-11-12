"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import type { TechnicianLocation } from "../../domain/entities/realtime-tracking.entity";
import type {
  GeographicCoordinate,
  MutableCoordinate,
  TrackingSignal,
  ValidatedLocation,
} from "../../domain/entities/vehicle-motion.entity";
import {
  calculateDestinationHeading,
  createMotionTransition,
  getMotionFrame,
  signedDistanceInHeading,
  validateTechnicianLocation,
} from "../../domain/services/vehicle-motion.service";
import {
  bearingAtRouteDistance,
  calculateBearing,
  distanceBetweenCoordinates,
  measureRouteLeg,
  projectCoordinateToRoute,
  sliceRouteFromDistance,
  sliceRouteBetweenDistances,
} from "../../domain/services/route-progress.service";
import { VEHICLE_MOTION_CONFIG } from "../../domain/services/vehicle-motion-config";
import { updateTechnicianVehicleHeading } from "../components/elements/detail/assignment-detail-markers";

type LeafletRef<T> = { current: T | null };

type UseAnimatedTechnicianLocationOptions = {
  assignmentId: string;
  enabled: boolean;
  activeStopId: string | null;
  activeStopOrderIndex: number | null;
  routeCoordinates: readonly GeographicCoordinate[] | null;
  technicianLocation: TechnicianLocation | null;
  markerRef: LeafletRef<L.Marker>;
  routePolylineRef: LeafletRef<L.Polyline>;
  onInitialCoordinate: (coordinate: MutableCoordinate, heading: number) => void;
  onSignalChange?: (signal: TrackingSignal) => void;
};

function toLeafletCoordinate(coordinate: GeographicCoordinate): L.LatLngTuple {
  return [coordinate[0], coordinate[1]];
}

export function useAnimatedTechnicianLocation({
  assignmentId,
  enabled,
  activeStopId,
  activeStopOrderIndex,
  routeCoordinates,
  technicianLocation,
  markerRef,
  routePolylineRef,
  onInitialCoordinate,
  onSignalChange,
}: UseAnimatedTechnicianLocationOptions): void {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() =>
    typeof window !== "undefined" && Boolean(
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    )
  );
  const measuredRoute = useMemo(
    () => routeCoordinates
      ? measureRouteLeg(routeCoordinates, activeStopId, activeStopOrderIndex)
      : null,
    [activeStopId, activeStopOrderIndex, routeCoordinates]
  );

  const signalRef = useRef<TrackingSignal>("waiting");
  const onSignalChangeRef = useRef(onSignalChange);
  const initialCoordinateCallbackRef = useRef(onInitialCoordinate);
  const measuredRouteRef = useRef(measuredRoute);
  const previousActiveStopIdRef = useRef(activeStopId);
  const previousAssignmentIdRef = useRef(assignmentId);
  const previousMeasuredRouteRef = useRef(measuredRoute);
  const lastValidatedLocationRef = useRef<ValidatedLocation | null>(null);
  const visibleCoordinateRef = useRef<MutableCoordinate | null>(null);
  const visibleHeadingRef = useRef(0);
  const travelHeadingRef = useRef<number | null>(null);
  const waitingForReverseRef = useRef(false);
  const lastRouteDistanceRef = useRef<number | null>(null);
  const lastAcceptedAtRef = useRef<number | null>(null);
  const transitionRef = useRef<ReturnType<typeof createMotionTransition> | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const signalNotificationFrameRef = useRef<number | null>(null);
  const staleTimeoutRef = useRef<number | null>(null);
  const lastRoutePaintAtRef = useRef(0);

  useEffect(() => {
    measuredRouteRef.current = measuredRoute;
    onSignalChangeRef.current = onSignalChange;
    initialCoordinateCallbackRef.current = onInitialCoordinate;
  }, [measuredRoute, onInitialCoordinate, onSignalChange]);

  const changeSignal = useCallback((next: TrackingSignal) => {
    if (signalRef.current === next) return;
    signalRef.current = next;
    if (signalNotificationFrameRef.current != null) {
      cancelAnimationFrame(signalNotificationFrameRef.current);
    }
    signalNotificationFrameRef.current = requestAnimationFrame(() => {
      signalNotificationFrameRef.current = null;
      onSignalChangeRef.current?.(next);
    });
  }, []);

  const paintRouteFromDistance = useCallback((distanceMeters: number) => {
    const route = measuredRouteRef.current;
    const polyline = routePolylineRef.current;
    if (!route || !polyline) return;
    const remaining = sliceRouteFromDistance(route, distanceMeters).remainingCoordinates;
    polyline.setLatLngs(remaining.map(toLeafletCoordinate));
    polyline.redraw();
  }, [routePolylineRef]);

  const paintMarker = useCallback((coordinate: GeographicCoordinate, heading: number) => {
    markerRef.current?.setLatLng([coordinate[0], coordinate[1]]);
    updateTechnicianVehicleHeading(markerRef.current, heading);
    visibleCoordinateRef.current = [coordinate[0], coordinate[1]];
    visibleHeadingRef.current = heading;
  }, [markerRef]);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setPrefersReducedMotion(media.matches);
    media.addEventListener("change", updatePreference);
    return () => media.removeEventListener("change", updatePreference);
  }, []);

  useEffect(() => () => {
    if (animationFrameRef.current != null) cancelAnimationFrame(animationFrameRef.current);
    if (signalNotificationFrameRef.current != null) cancelAnimationFrame(signalNotificationFrameRef.current);
    if (staleTimeoutRef.current != null) window.clearTimeout(staleTimeoutRef.current);
    animationFrameRef.current = null;
    signalNotificationFrameRef.current = null;
    staleTimeoutRef.current = null;
    transitionRef.current = null;
  }, [enabled]);

  // Cambiar la asignación o la parada invalida la trayectoria anterior, pero no
  // mueve el marcador. El nuevo tramo parte desde la posición que ya se ve.
  useEffect(() => {
    const routeChanged = previousActiveStopIdRef.current !== activeStopId ||
      previousMeasuredRouteRef.current !== measuredRoute;
    const assignmentChanged = previousAssignmentIdRef.current !== assignmentId;
    previousActiveStopIdRef.current = activeStopId;
    previousAssignmentIdRef.current = assignmentId;
    previousMeasuredRouteRef.current = measuredRoute;
    if (!routeChanged && !assignmentChanged) return;

    if (animationFrameRef.current != null) cancelAnimationFrame(animationFrameRef.current);
    animationFrameRef.current = null;
    transitionRef.current = null;
    lastRouteDistanceRef.current = null;
    travelHeadingRef.current = null;
    waitingForReverseRef.current = false;

    const route = measuredRouteRef.current;
    const visible = visibleCoordinateRef.current;
    if (route && visible) {
      const projection = projectCoordinateToRoute(visible, route);
      if (projection.distanceFromRouteMeters <= VEHICLE_MOTION_CONFIG.maxRouteSnapMeters) {
        lastRouteDistanceRef.current = projection.distanceAlongRouteMeters;
        paintRouteFromDistance(projection.distanceAlongRouteMeters);
        if (signalRef.current !== "stale") changeSignal("live");
      } else {
        paintRouteFromDistance(0);
        if (signalRef.current !== "stale") changeSignal("off-route");
      }
    } else if (route) {
      paintRouteFromDistance(0);
    } else if (signalRef.current !== "stale") {
      changeSignal("live");
    }
  }, [activeStopId, assignmentId, changeSignal, measuredRoute, paintMarker, paintRouteFromDistance]);

  useEffect(() => {
    if (!enabled) {
      if (animationFrameRef.current != null) cancelAnimationFrame(animationFrameRef.current);
      if (staleTimeoutRef.current != null) window.clearTimeout(staleTimeoutRef.current);
      animationFrameRef.current = null;
      staleTimeoutRef.current = null;
      transitionRef.current = null;
      return;
    }
    if (!technicianLocation) return;

    const now = Date.now();
    const previous = lastValidatedLocationRef.current;
    const validation = validateTechnicianLocation(technicianLocation, previous, now);
    if (validation.kind === "invalid") return;

    const wasStale = signalRef.current === "stale" || (
      lastAcceptedAtRef.current != null &&
      now - lastAcceptedAtRef.current >= VEHICLE_MOTION_CONFIG.staleAfterMs
    );
    const accepted = validation.location;
    lastValidatedLocationRef.current = accepted;
    lastAcceptedAtRef.current = now;
    if (staleTimeoutRef.current != null) window.clearTimeout(staleTimeoutRef.current);
    staleTimeoutRef.current = window.setTimeout(() => {
      if (lastAcceptedAtRef.current !== now) return;
      if (animationFrameRef.current != null) cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
      transitionRef.current = null;
      if (waitingForReverseRef.current) {
        paintMarker(accepted.coordinate, visibleHeadingRef.current);
      }
      waitingForReverseRef.current = false;
      travelHeadingRef.current = null;
      changeSignal("stale");
    }, VEHICLE_MOTION_CONFIG.staleAfterMs);

    const route = measuredRouteRef.current;
    const previousVisible = visibleCoordinateRef.current;
    if (validation.kind === "initial" || !previous || !previousVisible) {
      const projection = route
        ? projectCoordinateToRoute(accepted.coordinate, route)
        : null;
      const routeMatched = Boolean(
        projection && projection.distanceFromRouteMeters <= VEHICLE_MOTION_CONFIG.maxRouteSnapMeters
      );
      const heading = routeMatched && projection
        ? bearingAtRouteDistance(route!, projection.distanceAlongRouteMeters)
        : accepted.heading ?? 0;

      paintMarker(accepted.coordinate, heading);
      initialCoordinateCallbackRef.current([...accepted.coordinate], heading);
      lastRouteDistanceRef.current = routeMatched && projection
        ? projection.distanceAlongRouteMeters
        : null;
      if (route && routeMatched && projection) {
        paintRouteFromDistance(projection.distanceAlongRouteMeters);
      } else if (route) {
        paintRouteFromDistance(0);
      }
      changeSignal(route && !routeMatched ? "off-route" : "live");
      return;
    }

    const stationary = validation.kind === "stationary";
    if (stationary && !waitingForReverseRef.current && !transitionRef.current) {
      if (wasStale) {
        const projection = route
          ? projectCoordinateToRoute(accepted.coordinate, route, lastRouteDistanceRef.current)
          : null;
        const routeMatched = Boolean(
          projection && projection.distanceFromRouteMeters <= VEHICLE_MOTION_CONFIG.maxRouteSnapMeters
        );
        changeSignal(route && !routeMatched ? "off-route" : "live");
      }
      travelHeadingRef.current = null;
      return;
    }

    const origin = previousVisible;
    const directDistance = distanceBetweenCoordinates(origin, accepted.coordinate);
    const travelHeading = travelHeadingRef.current;
    const tolerance = VEHICLE_MOTION_CONFIG.directionToleranceMeters;
    const signedDistance = travelHeading == null ? 0 :
      signedDistanceInHeading(origin, accepted.coordinate, travelHeading);
    const behind = signedDistance < -tolerance;
    const reversing = travelHeading != null &&
      signedDistanceInHeading(previous.coordinate, accepted.coordinate, travelHeading) < -tolerance;
    const wasAnimating = transitionRef.current != null;
    if (animationFrameRef.current != null) cancelAnimationFrame(animationFrameRef.current);
    animationFrameRef.current = null;
    transitionRef.current = null;

    // Un fix detrás del dibujo puede ser el GPS alcanzando el avance estimado.
    if (!wasStale && !prefersReducedMotion && !stationary && behind &&
      (!waitingForReverseRef.current || !reversing)) {
      waitingForReverseRef.current = true;
      return;
    }
    const catchUp = (wasAnimating || waitingForReverseRef.current) &&
      signedDistance > tolerance;
    waitingForReverseRef.current = false;

    let originProjection = null;
    let destinationProjection = null;
    let pathCoordinates: MutableCoordinate[] | null = null;
    let trustedRoute = false;

    if (route) {
      const routeHint = lastRouteDistanceRef.current;
      const candidateDestination = projectCoordinateToRoute(
        accepted.coordinate,
        route,
        routeHint
      );
      const candidateOrigin = projectCoordinateToRoute(
        origin,
        route,
        routeHint ?? candidateDestination.distanceAlongRouteMeters
      );
      const routeDistanceDelta = Math.abs(
        candidateDestination.distanceAlongRouteMeters - candidateOrigin.distanceAlongRouteMeters
      );
      const coherentProgress = routeDistanceDelta <=
        directDistance * 3 + VEHICLE_MOTION_CONFIG.maxRouteProgressDisagreementMeters;
      trustedRoute =
        candidateOrigin.distanceFromRouteMeters <= VEHICLE_MOTION_CONFIG.maxRouteSnapMeters &&
        candidateDestination.distanceFromRouteMeters <= VEHICLE_MOTION_CONFIG.maxRouteSnapMeters &&
        coherentProgress;

      if (trustedRoute) {
        originProjection = candidateOrigin;
        destinationProjection = candidateDestination;
        const routeSlice = sliceRouteBetweenDistances(
          route,
          candidateOrigin.distanceAlongRouteMeters,
          candidateDestination.distanceAlongRouteMeters
        );
        pathCoordinates = stationary ? null : [
          [...origin],
          ...routeSlice.slice(1),
          [...accepted.coordinate],
        ];
        lastRouteDistanceRef.current = candidateDestination.distanceAlongRouteMeters;
      }
    }

    const routeBearing = trustedRoute && route && originProjection && destinationProjection
      ? bearingAtRouteDistance(route, destinationProjection.distanceAlongRouteMeters) +
        (destinationProjection.distanceAlongRouteMeters < originProjection.distanceAlongRouteMeters ? 180 : 0)
      : null;
    const destinationHeading = stationary ? visibleHeadingRef.current : calculateDestinationHeading(
      origin,
      trustedRoute && destinationProjection
        ? destinationProjection.coordinate
        : accepted.coordinate,
      routeBearing,
      accepted.heading
    );

    if (wasStale) {
      travelHeadingRef.current = null;
      paintMarker(accepted.coordinate, accepted.heading ?? destinationHeading);
      if (trustedRoute && destinationProjection) {
        paintRouteFromDistance(destinationProjection.distanceAlongRouteMeters);
      }
      changeSignal(route && !trustedRoute ? "off-route" : "live");
      return;
    }

    const intervalMs = accepted.timestampMs - previous.timestampMs;
    travelHeadingRef.current = stationary
      ? null
      : routeBearing ?? calculateBearing(previous.coordinate, accepted.coordinate);

    const transition = createMotionTransition({
      origin: [...origin],
      destination: [...accepted.coordinate],
      originHeading: visibleHeadingRef.current,
      destinationHeading,
      intervalMs: stationary ? 450 : intervalMs,
      catchUp,
      startedAtMs: performance.now(),
      originProjection,
      destinationProjection,
      pathCoordinates,
    });
    transitionRef.current = transition;
    changeSignal(route && !trustedRoute ? "off-route" : "live");

    const animate = (frameTime: number) => {
      if (transitionRef.current !== transition) return;
      const frame = getMotionFrame(transition, frameTime);
      paintMarker(frame.coordinate, frame.heading);
      if (
        route && trustedRoute && frame.distanceAlongRouteMeters != null &&
        frameTime - lastRoutePaintAtRef.current >= VEHICLE_MOTION_CONFIG.routeProgressUpdateIntervalMs
      ) {
        lastRoutePaintAtRef.current = frameTime;
        paintRouteFromDistance(frame.distanceAlongRouteMeters);
      }

      if (frame.complete) {
        transitionRef.current = null;
        if (route && trustedRoute && destinationProjection) {
          paintRouteFromDistance(destinationProjection.distanceAlongRouteMeters);
        }
        animationFrameRef.current = null;
        return;
      }
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    if (prefersReducedMotion) {
      transitionRef.current = null;
      paintMarker(transition.destination, destinationHeading);
      if (route && trustedRoute && destinationProjection) {
        paintRouteFromDistance(destinationProjection.distanceAlongRouteMeters);
      }
      animationFrameRef.current = null;
    } else {
      animationFrameRef.current = requestAnimationFrame(animate);
    }

  }, [
    changeSignal,
    enabled,
    paintMarker,
    paintRouteFromDistance,
    prefersReducedMotion,
    technicianLocation,
  ]);

  useEffect(() => {
    if (!prefersReducedMotion) return;
    const transition = transitionRef.current;
    const confirmed = lastValidatedLocationRef.current;
    if (!transition && !waitingForReverseRef.current) return;
    if (animationFrameRef.current != null) cancelAnimationFrame(animationFrameRef.current);
    animationFrameRef.current = null;
    transitionRef.current = null;
    waitingForReverseRef.current = false;
    travelHeadingRef.current = null;
    if (confirmed) paintMarker(confirmed.coordinate, transition?.destinationHeading ?? visibleHeadingRef.current);
    if (transition?.destinationDistanceAlongRoute != null) {
      paintRouteFromDistance(transition.destinationDistanceAlongRoute);
    }
  }, [paintMarker, paintRouteFromDistance, prefersReducedMotion]);

}
