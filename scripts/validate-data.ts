/**
 * Data integrity checks from knowledge/50_MAP_QA_CHECKLIST.md, as code.
 * Run with: npm run validate
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { XMLParser } from "fast-xml-parser";

import {
  mapManifest,
  parkIntelligence,
  routeLegsFile,
  tripDaysFile,
  tripOperations,
  waypointsFile,
} from "../src/lib/data";

const errors: string[] = [];
const check = (ok: boolean, message: string) => {
  if (!ok) errors.push(message);
};

// Unique waypoint IDs (coordinate ranges are enforced by the Zod schema).
const waypointIds = waypointsFile.waypoints.map((w) => w.id);
check(
  new Set(waypointIds).size === waypointIds.length,
  "waypoints.json contains duplicate ids",
);

// Every manifest stop references an existing waypoint; every waypoint is used.
const usedWaypointIds = new Set<string>();
for (const day of mapManifest.days) {
  for (const id of day.waypointIds) {
    usedWaypointIds.add(id);
    check(waypointIds.includes(id), `${day.id} references unknown waypoint ${id}`);
  }
}
for (const id of waypointIds) {
  check(usedWaypointIds.has(id), `waypoint ${id} is not used by any day`);
}

// Map assets exist and are well-formed XML.
const publicDir = join(import.meta.dirname, "..", "public");
const xmlParser = new XMLParser();
for (const day of mapManifest.days) {
  for (const asset of [day.gpx, day.kml]) {
    const path = join(publicDir, asset);
    if (!existsSync(path)) {
      errors.push(`missing map asset: ${asset}`);
      continue;
    }
    try {
      xmlParser.parse(readFileSync(path, "utf8"), true);
    } catch (e) {
      errors.push(`invalid XML in ${asset}: ${e}`);
    }
  }
}

// GeoJSON parses and every feature id resolves.
const geojson = JSON.parse(
  readFileSync(join(publicDir, "maps/geojson/trip-map.geojson"), "utf8"),
) as { features: { id: string; geometry: { type: string } }[] };
for (const feature of geojson.features) {
  if (feature.geometry.type === "Point") {
    check(
      waypointIds.includes(feature.id),
      `geojson point ${feature.id} has no matching waypoint`,
    );
  } else {
    check(
      mapManifest.days.some((d) => d.id === feature.id),
      `geojson route ${feature.id} has no matching manifest day`,
    );
  }
}

// Trip days align with the map manifest, one per day, dates in order.
const tripDayIds = tripDaysFile.days.map((d) => d.id);
const manifestDayIds = mapManifest.days.map((d) => d.id);
check(
  JSON.stringify(tripDayIds) === JSON.stringify(manifestDayIds),
  `trip-days ids ${tripDayIds} do not match manifest ids ${manifestDayIds}`,
);
const dates = tripDaysFile.days.map((d) => d.date);
check(
  JSON.stringify(dates) === JSON.stringify([...dates].sort()),
  "trip-days dates are not in chronological order",
);
check(dates[0] === tripDaysFile.startDate, "startDate does not match first day");
check(dates[dates.length - 1] === tripDaysFile.endDate, "endDate does not match last day");

// Park references resolve, and every park is visited on its stated date.
const parkIds = new Set(parkIntelligence.parks.map((p) => p.id));
for (const day of tripDaysFile.days) {
  for (const parkId of day.parkIds) {
    check(parkIds.has(parkId), `${day.id} references unknown park ${parkId}`);
  }
}
for (const park of parkIntelligence.parks) {
  const day = tripDaysFile.days.find((d) => d.date === park.visitDate);
  check(
    day !== undefined && day.parkIds.includes(park.id),
    `park ${park.id} visitDate ${park.visitDate} has no matching trip day`,
  );
}

// Route legs cover every consecutive waypoint pair of every day.
for (const day of mapManifest.days) {
  const legs = routeLegsFile.days.find((d) => d.id === day.id)?.legs;
  if (!legs) {
    errors.push(`no route legs for ${day.id}`);
    continue;
  }
  const expected = day.waypointIds.slice(0, -1).map((id, i) => `${id}>${day.waypointIds[i + 1]}`);
  const actual = legs.map((l) => `${l.fromWaypointId}>${l.toWaypointId}`);
  check(
    JSON.stringify(expected) === JSON.stringify(actual),
    `route legs for ${day.id} do not match its waypoint sequence (regenerate with scripts/generate-route-legs.mjs)`,
  );
}

// Overnight cities exist for every night except the final drive home.
for (const day of tripDaysFile.days.slice(0, -1)) {
  check(
    tripOperations.nights.some((n) => n.date === day.date),
    `no overnight entry for ${day.id} (${day.date})`,
  );
}

if (errors.length > 0) {
  console.error(`Data validation failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}
console.log(
  `Data validation passed: ${waypointIds.length} waypoints, ` +
    `${mapManifest.days.length} map days, ${tripDaysFile.days.length} trip days, ` +
    `${parkIntelligence.parks.length} parks, ${tripOperations.nights.length} nights.`,
);
