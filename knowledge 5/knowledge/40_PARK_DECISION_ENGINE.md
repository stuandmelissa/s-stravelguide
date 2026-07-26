# Park Decision Engine

## Inputs
Current time/location, remaining daylight, weather risk, heat, altitude symptoms, road status, parking/crowds, traveler energy, hotel ETA, and completed hero moments.

## Modes
- `on_plan`: continue.
- `compress`: remove low-value stops.
- `swap`: replace a crowded/closed stop with a nearby alternative.
- `retreat`: leave due to weather, heat, illness, darkness, or closure.
- `bonus`: add only with genuine slack.

## Preserve order
Safety → hero experience → route continuity → food/rest → secondary stops.

## Examples
High parking risk plus a >20-minute expected wait triggers the best nearby alternative. High desert heat suppresses exposed hikes. Worsening altitude symptoms trigger descent/medical guidance. Unsafe Beartooth conditions trigger a safer route.
