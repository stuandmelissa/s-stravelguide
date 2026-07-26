# S&S Travel Guide

Adventure at your own pace.

A mobile-first, offline-first PWA for Stuart & Shay's 2026 western national parks road trip: Marion → Rocky Mountain → Arches → Bryce → Zion → Grand Teton → Yellowstone → Devils Tower → Mount Rushmore → home.

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS v4 + shadcn/ui
- Zod-validated seed data, Dexie (IndexedDB) for local-first user state
- Service worker for airplane-mode operation, no backend

## Development

```bash
npm install
npm run dev        # local dev server
npm run validate   # data integrity checks (also runs as part of build)
npm run lint
npm run build      # production build
```

## Project layout

- `src/` — application code (`src/lib/data.ts` is the typed data layer)
- `data/` — machine-readable trip seed data, validated by `src/lib/schemas.ts`
- `public/maps/` — GPX/KML/GeoJSON route assets and navigation launch links
- `knowledge/` — the product specification (files 00–51); read before coding
- `docs/` — kickoff summary documents

## Roadmap

- v0.1 — Home, Today, Hotels, Packing, offline shell (this release)
- v0.2 — Interactive map, GPS, offline map layers
- v0.3 — Recommendation engine ("what should we do next?")
- v0.4 — Memory journal
