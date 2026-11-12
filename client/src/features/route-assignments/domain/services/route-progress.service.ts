import type {
  GeographicCoordinate,
  MeasuredRouteLeg,
  MutableCoordinate,
  RouteProjection,
  VisualRouteProgress,
} from "../entities/vehicle-motion.entity";

const EARTH_RADIUS_METERS = 6_371_008.8;
const DEGREES_TO_RADIANS = Math.PI / 180;
const RADIANS_TO_DEGREES = 180 / Math.PI;

export function distanceBetweenCoordinates(
  first: GeographicCoordinate,
  second: GeographicCoordinate
): number {
  const latitudeDelta = (second[0] - first[0]) * DEGREES_TO_RADIANS;
  const longitudeDelta = (second[1] - first[1]) * DEGREES_TO_RADIANS;
  const latitude1 = first[0] * DEGREES_TO_RADIANS;
  const latitude2 = second[0] * DEGREES_TO_RADIANS;
  const haversine = Math.min(1, Math.max(0,
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(latitude1) * Math.cos(latitude2) * Math.sin(longitudeDelta / 2) ** 2
  ));
  return 2 * EARTH_RADIUS_METERS * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

export function calculateBearing(
  start: GeographicCoordinate,
  end: GeographicCoordinate
): number {
  const latitude1 = start[0] * DEGREES_TO_RADIANS;
  const latitude2 = end[0] * DEGREES_TO_RADIANS;
  const longitudeDelta = (end[1] - start[1]) * DEGREES_TO_RADIANS;
  const y = Math.sin(longitudeDelta) * Math.cos(latitude2);
  const x =
    Math.cos(latitude1) * Math.sin(latitude2) -
    Math.sin(latitude1) * Math.cos(latitude2) * Math.cos(longitudeDelta);
  return (Math.atan2(y, x) * RADIANS_TO_DEGREES + 360) % 360;
}

export function normalizeAngleDelta(from: number, to: number): number {
  return ((to - from + 540) % 360) - 180;
}

export function interpolateAngle(from: number, to: number, progress: number): number {
  return (from + normalizeAngleDelta(from, to) * progress + 360) % 360;
}

function projectToLocalMeters(
  point: GeographicCoordinate,
  origin: GeographicCoordinate
): [number, number] {
  const averageLatitude = ((point[0] + origin[0]) / 2) * DEGREES_TO_RADIANS;
  const x = (point[1] - origin[1]) * DEGREES_TO_RADIANS * EARTH_RADIUS_METERS * Math.cos(averageLatitude);
  const y = (point[0] - origin[0]) * DEGREES_TO_RADIANS * EARTH_RADIUS_METERS;
  return [x, y];
}

function unprojectFromLocalMeters(
  point: [number, number],
  origin: GeographicCoordinate
): MutableCoordinate {
  const latitude = origin[0] + (point[1] / EARTH_RADIUS_METERS) * RADIANS_TO_DEGREES;
  const averageLatitude = ((latitude + origin[0]) / 2) * DEGREES_TO_RADIANS;
  const longitude =
    origin[1] +
    (point[0] / (EARTH_RADIUS_METERS * Math.max(Math.cos(averageLatitude), 0.01))) *
      RADIANS_TO_DEGREES;
  return [latitude, longitude];
}

export function measureRouteLeg(
  coordinates: readonly GeographicCoordinate[],
  stopId: string | null = null,
  orderIndex: number | null = null
): MeasuredRouteLeg | null {
  if (coordinates.length < 2) return null;
  const points: MutableCoordinate[] = [];
  const cumulativeDistances = [0];

  for (const coordinate of coordinates) {
    if (
      !Number.isFinite(coordinate[0]) || !Number.isFinite(coordinate[1]) ||
      coordinate[0] < -90 || coordinate[0] > 90 ||
      coordinate[1] < -180 || coordinate[1] > 180
    ) return null;
    const previous = points.at(-1);
    if (previous && distanceBetweenCoordinates(previous, coordinate) < 0.05) continue;
    if (previous) {
      cumulativeDistances.push(
        cumulativeDistances.at(-1)! + distanceBetweenCoordinates(previous, coordinate)
      );
    }
    points.push([coordinate[0], coordinate[1]]);
  }

  if (points.length < 2) return null;
  return {
    stopId,
    orderIndex,
    coordinates: points,
    cumulativeDistances,
    totalDistanceMeters: cumulativeDistances.at(-1) ?? 0,
  };
}

export function projectCoordinateToRoute(
  coordinate: GeographicCoordinate,
  route: MeasuredRouteLeg,
  previousDistanceMeters?: number | null
): RouteProjection {
  let best: RouteProjection | null = null;
  let bestScore = Number.POSITIVE_INFINITY;

  for (let index = 0; index < route.coordinates.length - 1; index += 1) {
    const start = route.coordinates[index];
    const end = route.coordinates[index + 1];
    const startMeters = projectToLocalMeters(start, coordinate);
    const endMeters = projectToLocalMeters(end, coordinate);
    const segmentX = endMeters[0] - startMeters[0];
    const segmentY = endMeters[1] - startMeters[1];
    const lengthSquared = segmentX * segmentX + segmentY * segmentY;
    if (lengthSquared === 0) continue;

    const fraction = Math.max(
      0,
      Math.min(1, -(startMeters[0] * segmentX + startMeters[1] * segmentY) / lengthSquared)
    );
    const projectedMeters: [number, number] = [
      startMeters[0] + fraction * segmentX,
      startMeters[1] + fraction * segmentY,
    ];
    const distanceFromRouteMeters = Math.hypot(projectedMeters[0], projectedMeters[1]);
    const segmentLength = route.cumulativeDistances[index + 1] - route.cumulativeDistances[index];
    const distanceAlongRouteMeters = route.cumulativeDistances[index] + fraction * segmentLength;
    const distancePenalty =
      previousDistanceMeters == null
        ? 0
        : Math.min(Math.abs(distanceAlongRouteMeters - previousDistanceMeters) * 0.08, 80);
    const score = distanceFromRouteMeters + distancePenalty;

    if (score < bestScore) {
      bestScore = score;
      best = {
        coordinate: unprojectFromLocalMeters(projectedMeters, coordinate),
        distanceFromRouteMeters,
        distanceAlongRouteMeters,
        segmentIndex: index,
        segmentFraction: fraction,
        bearing: calculateBearing(start, end),
      };
    }
  }

  return best ?? {
    coordinate: [coordinate[0], coordinate[1]],
    distanceFromRouteMeters: Number.POSITIVE_INFINITY,
    distanceAlongRouteMeters: previousDistanceMeters ?? 0,
    segmentIndex: 0,
    segmentFraction: 0,
    bearing: 0,
  };
}

export function coordinateAtRouteDistance(
  route: MeasuredRouteLeg,
  distanceMeters: number
): { coordinate: MutableCoordinate; bearing: number } {
  const clamped = Math.max(0, Math.min(route.totalDistanceMeters, distanceMeters));
  let index = route.cumulativeDistances.findIndex((distance, currentIndex) =>
    currentIndex > 0 ? distance >= clamped : false
  );
  if (index < 1) index = route.coordinates.length - 1;

  const segmentStartDistance = route.cumulativeDistances[index - 1];
  const segmentEndDistance = route.cumulativeDistances[index];
  const segmentLength = segmentEndDistance - segmentStartDistance;
  const fraction = segmentLength > 0 ? (clamped - segmentStartDistance) / segmentLength : 0;
  const start = route.coordinates[index - 1];
  const end = route.coordinates[index];
  return {
    coordinate: [
      start[0] + (end[0] - start[0]) * fraction,
      start[1] + (end[1] - start[1]) * fraction,
    ],
    bearing: calculateBearing(start, end),
  };
}

export function bearingAtRouteDistance(
  route: MeasuredRouteLeg,
  distanceMeters: number
): number {
  const clamped = Math.max(0, Math.min(route.totalDistanceMeters, distanceMeters));
  let index = route.cumulativeDistances.findIndex((distance, currentIndex) =>
    currentIndex > 0 ? distance >= clamped : false
  );
  if (index < 1) index = route.coordinates.length - 1;
  const segmentBearing = calculateBearing(route.coordinates[index - 1], route.coordinates[index]);
  if (index < 2) return segmentBearing;

  // Suaviza el giro en el primer tercio de cada segmento, evitando un salto
  // angular justo al cruzar un vértice de la geometría vial.
  const segmentStart = route.cumulativeDistances[index - 1];
  const segmentEnd = route.cumulativeDistances[index];
  const segmentLength = segmentEnd - segmentStart;
  const fraction = segmentLength > 0 ? (clamped - segmentStart) / segmentLength : 1;
  if (fraction >= 0.34) return segmentBearing;

  const previousBearing = calculateBearing(route.coordinates[index - 2], route.coordinates[index - 1]);
  const easedFraction = Math.max(0, Math.min(1, fraction / 0.34));
  return interpolateAngle(previousBearing, segmentBearing, easedFraction);
}

export function sliceRouteFromDistance(
  route: MeasuredRouteLeg,
  distanceMeters: number
): VisualRouteProgress {
  const clamped = Math.max(0, Math.min(route.totalDistanceMeters, distanceMeters));
  const start = coordinateAtRouteDistance(route, clamped).coordinate;
  const nextVertexIndex = route.cumulativeDistances.findIndex(
    (distance, index) => index > 0 && distance > clamped
  );
  const remainingCoordinates = [
    start,
    ...(nextVertexIndex < 0 ? [] : route.coordinates.slice(nextVertexIndex)),
  ];
  return { distanceAlongRouteMeters: clamped, remainingCoordinates };
}

export function sliceRouteBetweenDistances(
  route: MeasuredRouteLeg,
  fromDistanceMeters: number,
  toDistanceMeters: number
): MutableCoordinate[] {
  const from = Math.max(0, Math.min(route.totalDistanceMeters, fromDistanceMeters));
  const to = Math.max(0, Math.min(route.totalDistanceMeters, toDistanceMeters));
  if (Math.abs(to - from) < 0.05) return [coordinateAtRouteDistance(route, from).coordinate];

  if (to > from) {
    const start = coordinateAtRouteDistance(route, from).coordinate;
    const inner = route.coordinates.filter((_, index) => {
      const distance = route.cumulativeDistances[index];
      return distance > from && distance < to;
    });
    return [start, ...inner, coordinateAtRouteDistance(route, to).coordinate];
  }

  const start = coordinateAtRouteDistance(route, from).coordinate;
  const inner = route.coordinates
    .map((coordinate, index) => ({ coordinate, distance: route.cumulativeDistances[index] }))
    .filter(({ distance }) => distance < from && distance > to)
    .reverse()
    .map(({ coordinate }) => [...coordinate] as MutableCoordinate);
  return [start, ...inner, coordinateAtRouteDistance(route, to).coordinate];
}
