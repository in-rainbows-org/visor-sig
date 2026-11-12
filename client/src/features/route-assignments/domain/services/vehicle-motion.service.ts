import type {
  LocationValidation,
  MotionFrame,
  MotionTransition,
  MutableCoordinate,
  RouteProjection,
  ValidatedLocation,
} from "../entities/vehicle-motion.entity";
import type { TechnicianLocation } from "../entities/realtime-tracking.entity";
import { VEHICLE_MOTION_CONFIG } from "./vehicle-motion-config";
import {
  calculateBearing,
  distanceBetweenCoordinates,
  interpolateAngle,
} from "./route-progress.service";

export function validateTechnicianLocation(
  input: TechnicianLocation,
  previous: ValidatedLocation | null,
  receivedAtMs: number
): LocationValidation {
  if (
    !Number.isFinite(input.latitude) ||
    !Number.isFinite(input.longitude) ||
    input.latitude < -90 || input.latitude > 90 ||
    input.longitude < -180 || input.longitude > 180
  ) return { kind: "invalid", reason: "coordinates" };

  const timestampMs = Date.parse(input.timestamp);
  if (!Number.isFinite(timestampMs)) return { kind: "invalid", reason: "timestamp" };
  if (previous && timestampMs <= previous.timestampMs) {
    return { kind: "invalid", reason: "outdated" };
  }
  if (input.speed != null && (!Number.isFinite(input.speed) || input.speed < 0)) {
    return { kind: "invalid", reason: "speed" };
  }

  const location: ValidatedLocation = {
    coordinate: [input.latitude, input.longitude],
    heading: typeof input.heading === "number" && Number.isFinite(input.heading)
      ? ((input.heading % 360) + 360) % 360
      : null,
    speed: input.speed ?? null,
    timestampMs,
    receivedAtMs,
  };
  if (!previous) return { kind: "initial", location };

  if (location.speed != null && location.speed > VEHICLE_MOTION_CONFIG.maxPlausibleSpeedMetersPerSecond) {
    return { kind: "invalid", reason: "speed" };
  }
  const distanceMeters = distanceBetweenCoordinates(previous.coordinate, location.coordinate);
  const intervalMs = timestampMs - previous.timestampMs;
  if (distanceMeters < VEHICLE_MOTION_CONFIG.stationaryThresholdMeters) {
    return { kind: "stationary", location, distanceMeters };
  }
  const speedMetersPerSecond = distanceMeters / (intervalMs / 1000);
  if (speedMetersPerSecond > VEHICLE_MOTION_CONFIG.maxPlausibleSpeedMetersPerSecond) {
    return { kind: "invalid", reason: "speed" };
  }
  return { kind: "moving", location, distanceMeters, intervalMs };
}

export function createMotionTransition(options: {
  origin: MutableCoordinate;
  destination: MutableCoordinate;
  originHeading: number;
  destinationHeading: number;
  intervalMs: number;
  startedAtMs: number;
  catchUp?: boolean;
  originProjection?: RouteProjection | null;
  destinationProjection?: RouteProjection | null;
  pathCoordinates?: MutableCoordinate[] | null;
}): MotionTransition {
  const cadenceDuration = options.intervalMs * VEHICLE_MOTION_CONFIG.animationCadenceRatio *
    (options.catchUp ? VEHICLE_MOTION_CONFIG.catchUpDurationRatio : 1);
  const durationMs = Math.min(
    VEHICLE_MOTION_CONFIG.maxAnimationDurationMs,
    Math.max(VEHICLE_MOTION_CONFIG.minAnimationDurationMs, cadenceDuration)
  );
  const trustedRoute =
    options.originProjection != null && options.destinationProjection != null &&
    options.pathCoordinates != null && options.pathCoordinates.length >= 2;
  const pathCoordinates: MutableCoordinate[] | null = trustedRoute
    ? options.pathCoordinates!.map(([latitude, longitude]) => [latitude, longitude])
    : null;
  const pathCumulativeDistances = pathCoordinates
    ? pathCoordinates.map((coordinate, index) => index === 0
      ? 0
      : distanceBetweenCoordinates(pathCoordinates[index - 1], coordinate))
    : null;
  if (pathCumulativeDistances && pathCoordinates) {
    for (let index = 1; index < pathCumulativeDistances.length; index += 1) {
      pathCumulativeDistances[index] += pathCumulativeDistances[index - 1];
    }
  }

  return {
    origin: [...options.origin],
    destination: [...options.destination],
    originDistanceAlongRoute: trustedRoute ? options.originProjection!.distanceAlongRouteMeters : null,
    destinationDistanceAlongRoute: trustedRoute ? options.destinationProjection!.distanceAlongRouteMeters : null,
    startedAtMs: options.startedAtMs,
    durationMs,
    originHeading: options.originHeading,
    destinationHeading: options.destinationHeading,
    pathCoordinates,
    pathCumulativeDistances,
    pathTotalDistanceMeters: pathCumulativeDistances?.at(-1) ?? null,
  };
}

export function signedDistanceInHeading(
  origin: MutableCoordinate,
  destination: MutableCoordinate,
  heading: number
): number {
  const angle = (calculateBearing(origin, destination) - heading) * Math.PI / 180;
  return distanceBetweenCoordinates(origin, destination) * Math.cos(angle);
}

function pointAlongPath(
  coordinates: readonly MutableCoordinate[],
  cumulativeDistances: readonly number[],
  totalLength: number,
  progress: number
): { coordinate: MutableCoordinate; heading: number } {
  if (totalLength <= 0) {
    return { coordinate: [...coordinates.at(-1)!], heading: 0 };
  }

  const targetDistance = totalLength * progress;
  for (let index = 1; index < cumulativeDistances.length; index += 1) {
    const segmentStart = cumulativeDistances[index - 1];
    const segmentEnd = cumulativeDistances[index];
    const segmentLength = segmentEnd - segmentStart;
    if (targetDistance <= segmentEnd || index === cumulativeDistances.length - 1) {
      const fraction = segmentLength > 0 ? (targetDistance - segmentStart) / segmentLength : 1;
      const start = coordinates[index];
      const prior = coordinates[index - 1];
      const segmentBearing = calculateBearing(prior, start);
      const previousBearing = index >= 2
        ? calculateBearing(coordinates[index - 2], prior)
        : segmentBearing;
      const heading = fraction < 0.34
        ? interpolateAngle(previousBearing, segmentBearing, fraction / 0.34)
        : segmentBearing;
      return {
        coordinate: [prior[0] + (start[0] - prior[0]) * fraction, prior[1] + (start[1] - prior[1]) * fraction],
        heading,
      };
    }
  }
  return { coordinate: [...coordinates.at(-1)!], heading: 0 };
}

export function getMotionFrame(transition: MotionTransition, timestampMs: number): MotionFrame {
  const progress = Math.max(0, Math.min(1, (timestampMs - transition.startedAtMs) / transition.durationMs));
  // Conserva velocidad al acercarse al fix para enlazar con el avance estimado.
  const easedProgress = progress + 0.25 * progress * (1 - progress);
  const routeProgress =
    transition.originDistanceAlongRoute != null && transition.destinationDistanceAlongRoute != null
      ? transition.originDistanceAlongRoute +
        (transition.destinationDistanceAlongRoute - transition.originDistanceAlongRoute) * easedProgress
      : null;

  if (
    transition.pathCoordinates && transition.pathCoordinates.length >= 2 &&
    transition.pathCumulativeDistances && transition.pathTotalDistanceMeters != null
  ) {
    const pathFrame = pointAlongPath(
      transition.pathCoordinates,
      transition.pathCumulativeDistances,
      transition.pathTotalDistanceMeters,
      easedProgress
    );
    return {
      coordinate: pathFrame.coordinate,
      heading: interpolateAngle(transition.originHeading, pathFrame.heading, Math.min(1, easedProgress * 2)),
      distanceAlongRouteMeters: routeProgress,
      complete: progress >= 1,
    };
  }

  return {
    coordinate: [
      transition.origin[0] + (transition.destination[0] - transition.origin[0]) * easedProgress,
      transition.origin[1] + (transition.destination[1] - transition.origin[1]) * easedProgress,
    ],
    heading: interpolateAngle(transition.originHeading, transition.destinationHeading, easedProgress),
    distanceAlongRouteMeters: null,
    complete: progress >= 1,
  };
}

export function calculateDestinationHeading(
  origin: MutableCoordinate,
  destination: MutableCoordinate,
  routeBearing?: number | null,
  gpsHeading?: number | null
): number {
  const displacement = distanceBetweenCoordinates(origin, destination);
  if (displacement < VEHICLE_MOTION_CONFIG.stationaryThresholdMeters) {
    return gpsHeading ?? routeBearing ?? 0;
  }
  return routeBearing ?? calculateBearing(origin, destination);
}
