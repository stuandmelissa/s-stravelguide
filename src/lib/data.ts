import tripOperationsJson from "../../data/trip-operations.json";
import parkIntelligenceJson from "../../data/park-intelligence.json";
import parkSourcesJson from "../../data/park-sources.json";
import waypointsJson from "../../data/waypoints.json";
import mapManifestJson from "../../data/map-manifest.json";
import routeLegsJson from "../../data/route-legs.json";
import tripDaysJson from "../../data/trip-days.json";

import {
  mapManifestSchema,
  parkIntelligenceSchema,
  parkSourcesSchema,
  routeLegsFileSchema,
  tripDaysFileSchema,
  tripOperationsSchema,
  waypointsFileSchema,
  type MapDay,
  type Night,
  type Park,
  type RouteLeg,
  type TripDay,
  type Waypoint,
} from "./schemas";

/**
 * Typed, validated access to the bundled trip data.
 * All parsing happens once at module load; a bad data file fails the build,
 * never the trip.
 */

export const tripOperations = tripOperationsSchema.parse(tripOperationsJson);
export const parkIntelligence = parkIntelligenceSchema.parse(parkIntelligenceJson);
export const parkSources = parkSourcesSchema.parse(parkSourcesJson);
export const waypointsFile = waypointsFileSchema.parse(waypointsJson);
export const mapManifest = mapManifestSchema.parse(mapManifestJson);
export const routeLegsFile = routeLegsFileSchema.parse(routeLegsJson);
export const tripDaysFile = tripDaysFileSchema.parse(tripDaysJson);

export const tripDays: TripDay[] = tripDaysFile.days;

const waypointById = new Map<string, Waypoint>(
  waypointsFile.waypoints.map((w) => [w.id, w]),
);
const parkById = new Map<string, Park>(
  parkIntelligence.parks.map((p) => [p.id, p]),
);
const mapDayById = new Map<string, MapDay>(
  mapManifest.days.map((d) => [d.id, d]),
);
const nightByDate = new Map<string, Night>(
  tripOperations.nights.map((n) => [n.date, n]),
);

export function getWaypoint(id: string): Waypoint {
  const waypoint = waypointById.get(id);
  if (!waypoint) throw new Error(`Unknown waypoint: ${id}`);
  return waypoint;
}

export function getPark(id: string): Park {
  const park = parkById.get(id);
  if (!park) throw new Error(`Unknown park: ${id}`);
  return park;
}

const PARK_SOURCE_PREFIX: Record<string, string> = {
  rmnp: "rmnp",
  arches: "arches",
  bryce: "bryce",
  zion: "zion",
  "grand-teton": "grte",
  yellowstone: "yellowstone",
  "devils-tower": "devils-tower",
};

/** Official sources for a park's volatile facts (timed entry, roads, shuttles). */
export function getParkSources(parkId: string) {
  const prefix = PARK_SOURCE_PREFIX[parkId];
  if (!prefix) return [];
  return parkSources.sources.filter((s) => s.id.startsWith(prefix));
}

export function getMapDay(dayId: string): MapDay | undefined {
  return mapDayById.get(dayId);
}

/** Waypoints for a trip day, in route order. */
export function getDayWaypoints(dayId: string): Waypoint[] {
  const mapDay = mapDayById.get(dayId);
  if (!mapDay) return [];
  return mapDay.waypointIds.map(getWaypoint);
}

/** Where the travelers sleep at the end of the given date, if on the trip. */
export function getNight(date: string): Night | undefined {
  return nightByDate.get(date);
}

const legsByDay = new Map(routeLegsFile.days.map((d) => [d.id, d.legs]));

/** Road legs between consecutive stops of a day (free-flow estimates). */
export function getDayLegs(dayId: string): RouteLeg[] {
  return legsByDay.get(dayId) ?? [];
}

export function getLeg(dayId: string, fromId: string, toId: string): RouteLeg | undefined {
  return getDayLegs(dayId).find(
    (l) => l.fromWaypointId === fromId && l.toWaypointId === toId,
  );
}

export interface DriveTotals {
  miles: number;
  minutes: number;
}

export function getDayDriveTotals(dayId: string): DriveTotals {
  const legs = getDayLegs(dayId);
  return {
    miles: legs.reduce((s, l) => s + l.distanceMiles, 0),
    minutes: legs.reduce((s, l) => s + l.driveMinutes, 0),
  };
}

export function formatDrive(totals: DriveTotals): string {
  const h = Math.floor(totals.minutes / 60);
  const m = totals.minutes % 60;
  const time = h > 0 ? (m > 0 ? `${h} h ${m} min` : `${h} h`) : `${m} min`;
  return `${totals.miles} mi · ~${time}`;
}

export function getTripDay(dayId: string): TripDay | undefined {
  return tripDays.find((d) => d.id === dayId);
}

export function getTripDayByDate(date: string): TripDay | undefined {
  return tripDays.find((d) => d.date === date);
}

/** Format a Date as YYYY-MM-DD in the device's local time zone. */
export function toLocalIsoDate(now: Date): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export type TripPhase = "before" | "during" | "after";

export function getTripPhase(date: string): TripPhase {
  if (date < tripDaysFile.startDate) return "before";
  if (date > tripDaysFile.endDate) return "after";
  return "during";
}

/**
 * The day the app should treat as "today":
 * the matching trip day while traveling, day 1 before the trip,
 * and the final day after the trip ends.
 */
export function getCurrentTripDay(date: string): TripDay {
  const exact = getTripDayByDate(date);
  if (exact) return exact;
  if (getTripPhase(date) === "before") return tripDays[0];
  return tripDays[tripDays.length - 1];
}

export function formatTripDate(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}
