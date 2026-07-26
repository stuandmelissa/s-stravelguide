# Pack 5 Build Brief

## Required features
1. Park cards showing hero experience, access strategy, and route.
2. Stop cards with duration, difficulty, scores, parking risk, and offline notes.
3. “What should we do next?” recommendation action.
4. Compact and expanded route views.
5. Skip/swap logic with explanations.
6. Last-verified badges and official-source actions.
7. Wildlife guidance that expresses probability without promises.

## Components
ParkIntelCard, StopScoreRow, StopDetailSheet, RouteSequence, OperationalAlert, VolatileDataBadge, NextBestAction, CrowdRiskBadge, WildlifeWindow, SkipReason.

## Acceptance criteria
All park content works offline. Volatile facts show verification dates. Stops can be completed, skipped, or replaced. The app never invents closures, sightings, geyser times, or parking availability. Recommendations preserve safety and overnight routing.
