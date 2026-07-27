/**
 * Precomputes road distance and drive time between consecutive stops of each
 * trip day using the public OSRM demo server, writing data/route-legs.json.
 * Run manually when routes change: node scripts/generate-route-legs.mjs
 *
 * Times are free-flow estimates; the app labels them as such.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dirname, "..");
const waypoints = JSON.parse(readFileSync(join(root, "data/waypoints.json"), "utf8"));
const manifest = JSON.parse(readFileSync(join(root, "data/map-manifest.json"), "utf8"));
const byId = new Map(waypoints.waypoints.map((w) => [w.id, w]));

const days = [];
for (const day of manifest.days) {
  const ids = day.waypointIds;
  if (ids.length < 2) {
    days.push({ id: day.id, legs: [] });
    continue;
  }
  const coords = ids
    .map((id) => `${byId.get(id).longitude},${byId.get(id).latitude}`)
    .join(";");
  const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=false&steps=false`;
  const res = await fetch(url, { headers: { "User-Agent": "ss-travel-guide/1.0" } });
  if (!res.ok) throw new Error(`OSRM ${res.status} for ${day.id}`);
  const json = await res.json();
  if (json.code !== "Ok") throw new Error(`OSRM ${json.code} for ${day.id}`);
  const legs = json.routes[0].legs.map((leg, i) => ({
    fromWaypointId: ids[i],
    toWaypointId: ids[i + 1],
    distanceMiles: Math.round(leg.distance / 1609.344),
    driveMinutes: Math.round(leg.duration / 60),
  }));
  days.push({ id: day.id, legs });
  console.log(
    day.id,
    legs.reduce((s, l) => s + l.distanceMiles, 0),
    "mi,",
    Math.round(legs.reduce((s, l) => s + l.driveMinutes, 0) / 60 * 10) / 10,
    "h",
  );
  await new Promise((r) => setTimeout(r, 1200));
}

const out = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString().slice(0, 10),
  source: "OSRM driving profile; free-flow estimates without traffic",
  days,
};
writeFileSync(join(root, "data/route-legs.json"), JSON.stringify(out, null, 2) + "\n");
console.log("wrote data/route-legs.json");
