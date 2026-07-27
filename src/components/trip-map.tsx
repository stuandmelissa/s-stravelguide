"use client";

import { useEffect, useRef, useState } from "react";
import {
  LngLatBounds,
  Map as LibreMap,
  Marker,
  setWorkerUrl,
  type GeoJSONSource,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

// MapLibre's tile-parsing worker doesn't survive Turbopack bundling
// (the generated worker URL resolves to the page itself), so we serve the
// stock worker from /public. `npm run build` re-syncs it from node_modules.
if (typeof window !== "undefined") {
  setWorkerUrl("/maplibre-gl-worker.mjs");
}
import { useLiveQuery } from "dexie-react-hooks";
import { LocateFixed, MapPin, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { db, type StopState } from "@/lib/db";
import { getWaypoint, mapManifest, waypointsFile } from "@/lib/data";
import type { Waypoint } from "@/lib/schemas";
import { cn } from "@/lib/utils";

/** Free, keyless vector basemap (openfreemap.org); cached by the service worker. */
const MAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";

const TYPE_COLORS: Record<Waypoint["type"], string> = {
  destination: "#2f5d42",
  lodging: "#7a5236",
  park_entry: "#2f5d42",
  visitor_center: "#5b7c99",
  viewpoint: "#c05b2e",
  trailhead: "#6b8f4e",
  wildlife_zone: "#9b7c2f",
  fuel: "#6e6858",
  emergency: "#b3402e",
};

const TYPE_LABELS: Record<Waypoint["type"], string> = {
  destination: "Destination",
  lodging: "Hotel",
  park_entry: "Park entry",
  visitor_center: "Visitor center",
  viewpoint: "Viewpoint",
  trailhead: "Trailhead",
  wildlife_zone: "Wildlife area",
  fuel: "Fuel",
  emergency: "Emergency",
};

type DayFilter = "trip" | string;

function buildStopsGeoJson(
  filter: DayFilter,
  statusByKey: Map<string, string>,
): GeoJSON.FeatureCollection {
  const dayIds =
    filter === "trip"
      ? new Set(waypointsFile.waypoints.map((w) => w.id))
      : new Set(mapManifest.days.find((d) => d.id === filter)?.waypointIds ?? []);

  const features: GeoJSON.Feature[] = [];
  for (const w of waypointsFile.waypoints) {
    const inDay = dayIds.has(w.id);
    const status = filter === "trip" ? "" : (statusByKey.get(w.id) ?? "");
    // Spec (48_MAP_LAYER_SPEC): skipped stops leave the active route.
    if (inDay && status === "skipped") continue;
    features.push({
      type: "Feature",
      geometry: { type: "Point", coordinates: [w.longitude, w.latitude] },
      properties: {
        id: w.id,
        name: w.name,
        type: w.type,
        color: TYPE_COLORS[w.type],
        radius: w.type === "destination" || w.type === "lodging" ? 8 : 6,
        dimmed: inDay ? 0 : 1,
        completed: status === "completed" ? 1 : 0,
      },
    });
  }
  return { type: "FeatureCollection", features };
}

function buildRoutesGeoJson(filter: DayFilter): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: mapManifest.days
      .filter((d) => d.waypointIds.length > 1)
      .map((d) => ({
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates: d.waypointIds.map((id) => {
            const w = getWaypoint(id);
            return [w.longitude, w.latitude];
          }),
        },
        properties: { id: d.id, dimmed: filter !== "trip" && filter !== d.id ? 1 : 0 },
      })),
  };
}

function boundsFor(filter: DayFilter): LngLatBounds {
  const ids =
    filter === "trip"
      ? waypointsFile.waypoints.map((w) => w.id)
      : (mapManifest.days.find((d) => d.id === filter)?.waypointIds ?? []);
  const bounds = new LngLatBounds();
  for (const id of ids) {
    const w = getWaypoint(id);
    bounds.extend([w.longitude, w.latitude]);
  }
  return bounds;
}

export function TripMap({
  dayFilter,
  onSelectWaypoint,
}: {
  dayFilter: DayFilter;
  onSelectWaypoint: (waypoint: Waypoint | null) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LibreMap | null>(null);
  const userMarkerRef = useRef<Marker | null>(null);
  const [ready, setReady] = useState(false);
  const [baseMapFailed, setBaseMapFailed] = useState(false);
  const [locating, setLocating] = useState(false);

  const states = useLiveQuery(
    () =>
      dayFilter === "trip"
        ? Promise.resolve<StopState[]>([])
        : db.stopStates.where("dayId").equals(dayFilter).toArray(),
    [dayFilter],
  );
  const statusByKey = new Map((states ?? []).map((s) => [s.waypointId, s.status as string]));

  // Map lifecycle: created once.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new LibreMap({
      container: containerRef.current,
      style: MAP_STYLE,
      bounds: boundsFor("trip"),
      fitBoundsOptions: { padding: 48 },
      attributionControl: { compact: true },
      // Headless screenshot runs need the WebGL buffer preserved.
      canvasContextAttributes: {
        preserveDrawingBuffer: new URLSearchParams(window.location.search).has("e2e"),
      },
    });
    mapRef.current = map;
    // Exposed for end-to-end tests.
    (window as unknown as { __tripMap?: LibreMap }).__tripMap = map;

    const failTimer = setTimeout(() => {
      if (!map.isStyleLoaded()) setBaseMapFailed(true);
    }, 8000);

    map.on("load", () => {
      clearTimeout(failTimer);
      setBaseMapFailed(false);

      map.addSource("routes", { type: "geojson", data: buildRoutesGeoJson("trip") });
      map.addSource("stops", { type: "geojson", data: buildStopsGeoJson("trip", new Map()) });

      // Overview connections, not drivable geometry — dashed on purpose.
      map.addLayer({
        id: "route-lines",
        type: "line",
        source: "routes",
        paint: {
          "line-color": "#2f5d42",
          "line-width": 2.5,
          "line-dasharray": [2, 2],
          "line-opacity": ["case", ["==", ["get", "dimmed"], 1], 0.15, 0.7],
        },
      });
      map.addLayer({
        id: "stop-circles",
        type: "circle",
        source: "stops",
        paint: {
          "circle-radius": ["get", "radius"],
          "circle-color": ["get", "color"],
          "circle-stroke-width": 2,
          "circle-stroke-color": "#f6f1e6",
          "circle-opacity": [
            "case",
            ["==", ["get", "dimmed"], 1],
            0.25,
            ["==", ["get", "completed"], 1],
            0.45,
            0.95,
          ],
          "circle-stroke-opacity": ["case", ["==", ["get", "dimmed"], 1], 0.2, 0.9],
        },
      });
      map.addLayer({
        id: "stop-labels",
        type: "symbol",
        source: "stops",
        filter: ["in", ["get", "type"], ["literal", ["destination", "lodging"]]],
        layout: {
          "text-field": ["get", "name"],
          "text-size": 11,
          "text-offset": [0, 1.2],
          "text-anchor": "top",
          "text-font": ["Noto Sans Regular"],
        },
        paint: {
          "text-color": "#26251f",
          "text-halo-color": "#f6f1e6",
          "text-halo-width": 1.2,
          "text-opacity": ["case", ["==", ["get", "dimmed"], 1], 0.3, 1],
        },
      });

      map.on("click", "stop-circles", (e) => {
        const id = e.features?.[0]?.properties?.id as string | undefined;
        if (id) onSelectWaypoint(getWaypoint(id));
      });
      map.on("mouseenter", "stop-circles", () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", "stop-circles", () => {
        map.getCanvas().style.cursor = "";
      });

      setReady(true);
    });

    return () => {
      clearTimeout(failTimer);
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // React to day filter / stop status changes.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    (map.getSource("stops") as GeoJSONSource)?.setData(
      buildStopsGeoJson(dayFilter, statusByKey),
    );
    (map.getSource("routes") as GeoJSONSource)?.setData(
      buildRoutesGeoJson(dayFilter),
    );
    map.fitBounds(boundsFor(dayFilter), { padding: 48, maxZoom: 11, duration: 800 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dayFilter, ready, JSON.stringify([...statusByKey])]);

  const locate = () => {
    const map = mapRef.current;
    if (!map || !("geolocation" in navigator)) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const lngLat: [number, number] = [pos.coords.longitude, pos.coords.latitude];
        if (!userMarkerRef.current) {
          const el = document.createElement("div");
          el.className =
            "size-4 rounded-full border-2 border-white bg-slate-blue shadow-md";
          userMarkerRef.current = new Marker({ element: el })
            .setLngLat(lngLat)
            .addTo(map);
        } else {
          userMarkerRef.current.setLngLat(lngLat);
        }
        map.flyTo({ center: lngLat, zoom: Math.max(map.getZoom(), 10) });
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  return (
    <div className="relative h-[52vh] min-h-80 overflow-hidden rounded-3xl border border-border">
      {/* Explicit size: MapLibre's stylesheet forces position:relative on the
          container, which would collapse an absolutely-positioned div. */}
      <div ref={containerRef} className="h-full w-full" />
      <Button
        variant="outline"
        size="icon-lg"
        aria-label="Show my location"
        onClick={locate}
        className={cn(
          "absolute right-3 top-3 size-11 bg-card shadow-md",
          locating && "animate-pulse",
        )}
      >
        <LocateFixed aria-hidden />
      </Button>
      {baseMapFailed && (
        <div className="absolute inset-x-3 bottom-3 rounded-xl bg-card/95 p-3 text-xs text-muted-foreground shadow-md">
          The base map needs a connection right now. Your stops and navigation
          links below still work offline.
        </div>
      )}
    </div>
  );
}

export function WaypointSheet({
  waypoint,
  onClose,
}: {
  waypoint: Waypoint;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-x-0 bottom-14 z-40 mx-auto max-w-lg px-4 pb-[env(safe-area-inset-bottom)]">
      <div className="space-y-3 rounded-3xl border border-border bg-card p-5 shadow-xl">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <p className="font-semibold leading-snug">{waypoint.name}</p>
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge
                className="rounded-full text-white"
                style={{ backgroundColor: TYPE_COLORS[waypoint.type] }}
              >
                {TYPE_LABELS[waypoint.type]}
              </Badge>
              {waypoint.confidence === "approximate" && (
                <Badge className="rounded-full border-border bg-transparent text-muted-foreground">
                  Approximate area
                </Badge>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon-lg"
            className="size-11 shrink-0"
            aria-label="Close stop details"
            onClick={onClose}
          >
            <X aria-hidden />
          </Button>
        </div>
        {waypoint.type === "wildlife_zone" && (
          <p className="text-xs text-muted-foreground">
            Broad observation area — sightings are possible, never guaranteed.
            Only stop where it is safe and legal.
          </p>
        )}
        <div className="grid grid-cols-2 gap-2">
          <Button
            nativeButton={false}
            className="gap-1.5"
            render={
              <a href={waypoint.appleMaps} target="_blank" rel="noopener noreferrer" />
            }
          >
            <MapPin aria-hidden className="size-4" />
            Apple Maps
          </Button>
          <Button
            nativeButton={false}
            variant="outline"
            className="gap-1.5"
            render={
              <a href={waypoint.googleMaps} target="_blank" rel="noopener noreferrer" />
            }
          >
            <MapPin aria-hidden className="size-4" />
            Google Maps
          </Button>
        </div>
      </div>
    </div>
  );
}
