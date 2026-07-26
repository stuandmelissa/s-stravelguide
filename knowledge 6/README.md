# S&S Travel Guide — Pack 6: Maps, Routes & Offline Assets

Pack 6 adds the spatial layer to the S&S Travel Guide. It converts the itinerary and park intelligence from Packs 1–5 into import-ready waypoint files, scenic-drive overlays, shareable map links, and an offline-friendly map data model.

## What this pack contains

- A complete trip waypoint collection in GPX, KML, and GeoJSON
- Separate park and scenic-drive GPX files
- A route manifest that connects days, stops, priorities, and map assets
- Apple Maps and Google Maps launch links for every major stop
- Offline-map download guidance and verification rules
- A map-layer specification for the app
- A location confidence model so approximate waypoints are never presented as surveyed navigation points

## Important navigation note

These files are designed for trip planning, offline reference, and launching a route in a navigation app. GPX tracks in this pack connect waypoints with simple line segments; they are not turn-by-turn road geometry and must not override road closures, posted signs, or live navigation.

## Install order

Apply this pack after Packs 1–5. Copy the contents into the matching project directories, preserving filenames.
