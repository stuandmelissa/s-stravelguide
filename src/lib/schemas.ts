import { z } from "zod";

/**
 * Zod schemas for all seed data in /data.
 * These are the single source of truth for data shapes
 * (see knowledge/30_DATA_MODEL.md and knowledge/32_PARK_INTELLIGENCE_MODEL.md).
 */

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "expected YYYY-MM-DD");

// --- trip-operations.json ---

export const nightSchema = z.object({
  date: isoDate,
  city: z.string(),
  hotel: z.string().optional(),
  status: z.enum(["planned", "known", "booked"]),
  purpose: z.string().optional(),
  notes: z.string().optional(),
});

export const reservationSchema = z.object({
  title: z.string(),
  type: z.enum(["park-pass", "park-entry", "activity"]),
  status: z.enum(["planned", "verify", "confirmed", "not-required", "cancelled"]),
});

export const packingGroupSchema = z.object({
  id: z.string(),
  title: z.string(),
  items: z.array(z.string()).min(1),
});

export const tripOperationsSchema = z.object({
  schemaVersion: z.literal(1),
  tripId: z.string(),
  preferences: z.object({
    hotelBudgetTargetUsd: z.number(),
    preferredHotelPrograms: z.array(z.string()),
    fuelReminderFraction: z.number(),
    offlineFirst: z.boolean(),
    sweetTreatsEncouraged: z.boolean(),
  }),
  nights: z.array(nightSchema),
  reservations: z.array(reservationSchema),
  packingGroups: z.array(packingGroupSchema),
});

// --- park-intelligence.json ---

export const stopPrioritySchema = z.enum(["hero", "core", "bonus", "swap"]);

const score = z.number().int().min(1).max(10);

export const parkStopSchema = z.object({
  id: z.string(),
  name: z.string(),
  priority: stopPrioritySchema,
  durationMinutes: z.number().int().positive(),
  difficulty: z.enum(["easy", "moderate", "strenuous"]),
  scenicScore: score,
  photoScore: score,
  wildlifeScore: score,
  parkingRisk: score,
  notes: z.string(),
  skipWhen: z.string(),
});

export const parkSchema = z.object({
  id: z.string(),
  name: z.string(),
  visitDate: isoDate,
  hero: z.string(),
  verifiedAt: isoDate,
  volatile: z.boolean(),
  stops: z.array(parkStopSchema).min(1),
});

export const parkIntelligenceSchema = z.object({
  schemaVersion: z.literal(1),
  tripId: z.string(),
  generatedAt: isoDate,
  scoreScale: z.string(),
  parks: z.array(parkSchema).min(1),
});

// --- park-sources.json ---

export const parkSourcesSchema = z.object({
  schemaVersion: z.literal(1),
  verifiedAt: isoDate,
  sources: z.array(
    z.object({
      id: z.string(),
      url: z.string().url().startsWith("https://"),
      official: z.boolean(),
      volatile: z.boolean(),
    }),
  ),
});

// --- waypoints.json ---

export const waypointSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum([
    "destination",
    "park_entry",
    "visitor_center",
    "viewpoint",
    "trailhead",
    "wildlife_zone",
    "fuel",
    "emergency",
  ]),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  confidence: z.enum(["exact", "high", "approximate"]),
  appleMaps: z.string().url().startsWith("https://"),
  googleMaps: z.string().url().startsWith("https://"),
});

export const waypointsFileSchema = z.object({
  schemaVersion: z.literal(1),
  waypoints: z.array(waypointSchema).min(1),
});

// --- map-manifest.json ---

export const mapDaySchema = z.object({
  id: z.string(),
  title: z.string(),
  waypointIds: z.array(z.string()).min(1),
  gpx: z.string(),
  kml: z.string(),
});

export const mapManifestSchema = z.object({
  schemaVersion: z.literal(1),
  assetNote: z.string(),
  days: z.array(mapDaySchema).min(1),
});

// --- trip-days.json ---

export const tripDaySchema = z.object({
  id: z.string(),
  date: isoDate,
  title: z.string(),
  summary: z.string(),
  heroMoment: z.string().nullable(),
  parkIds: z.array(z.string()),
  driveSummary: z.string(),
  eveningNote: z.string(),
});

export const tripDaysFileSchema = z.object({
  schemaVersion: z.literal(1),
  tripId: z.string(),
  startDate: isoDate,
  endDate: isoDate,
  days: z.array(tripDaySchema).min(1),
});

// --- inferred types ---

export type Night = z.infer<typeof nightSchema>;
export type Reservation = z.infer<typeof reservationSchema>;
export type PackingGroup = z.infer<typeof packingGroupSchema>;
export type TripOperations = z.infer<typeof tripOperationsSchema>;
export type StopPriority = z.infer<typeof stopPrioritySchema>;
export type ParkStop = z.infer<typeof parkStopSchema>;
export type Park = z.infer<typeof parkSchema>;
export type ParkIntelligence = z.infer<typeof parkIntelligenceSchema>;
export type Waypoint = z.infer<typeof waypointSchema>;
export type MapDay = z.infer<typeof mapDaySchema>;
export type MapManifest = z.infer<typeof mapManifestSchema>;
export type TripDay = z.infer<typeof tripDaySchema>;
export type TripDaysFile = z.infer<typeof tripDaysFileSchema>;
