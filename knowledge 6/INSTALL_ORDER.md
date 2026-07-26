# Pack 6 Install Order

1. Install Packs 1–5 first.
2. Copy `knowledge/42_*` through `knowledge/51_*` into the project knowledge directory.
3. Copy `data/map-manifest.json` and `data/waypoints.json` into the app data directory.
4. Copy `maps/` into the app public/static asset directory.
5. Wire the map layer according to `knowledge/48_MAP_LAYER_SPEC.md`.
6. Validate import behavior with `knowledge/50_MAP_QA_CHECKLIST.md`.
