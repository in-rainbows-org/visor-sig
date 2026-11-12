import type { TechnicianLocation } from "./realtime-tracking.entity";

export type GeographicCoordinate = readonly [latitude: number, longitude: number];
export type MutableCoordinate = [latitude: number, longitude: number];

export type ValidatedLocation = {
  coordinate: MutableCoordinate;
  heading: number | null;
  speed: number | null;
  timestampMs: number;
  receivedAtMs: number;
};

export type LocationValidation =
  | { kind: "initial"; location: ValidatedLocation }
  | { kind: "moving"; location: ValidatedLocation; distanceMeters: number; intervalMs: number }
  | { kind: "stationary"; location: ValidatedLocation; distanceMeters: number }
  | { kind: "invalid"; reason: "coordinates" | "timestamp" | "speed" | "outdated" };

export type RouteProjection = {
  coordinate: MutableCoordinate;
  distanceFromRouteMeters: number;
  distanceAlongRouteMeters: number;
  segmentIndex: number;
  segmentFraction: number;
  bearing: number;
};

export type MeasuredRouteLeg = {
  stopId: string | null;
  orderIndex: number | null;
  coordinates: MutableCoordinate[];
  cumulativeDistances: number[];
  totalDistanceMeters: number;
};

export type MotionTransition = {
  origin: MutableCoordinate;
  destination: MutableCoordinate;
  originDistanceAlongRoute: number | null;
  destinationDistanceAlongRoute: number | null;
  startedAtMs: number;
  durationMs: number;
  originHeading: number;
  destinationHeading: number;
  pathCoordinates: MutableCoordinate[] | null;
  pathCumulativeDistances: number[] | null;
  pathTotalDistanceMeters: number | null;
};

export type VisualRouteProgress = {
  distanceAlongRouteMeters: number;
  remainingCoordinates: MutableCoordinate[];
};

export type MotionFrame = {
  coordinate: MutableCoordinate;
  heading: number;
  distanceAlongRouteMeters: number | null;
  complete: boolean;
};

export type MotionSource = TechnicianLocation & { receivedAtMs: number };

export type TrackingSignal = "waiting" | "live" | "stale" | "off-route";
