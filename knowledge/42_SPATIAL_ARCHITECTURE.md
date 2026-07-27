# Spatial Architecture

The spatial system has four layers: trip overview, daily route, park detail, and live navigation handoff. The S&S app explains and prioritizes; Apple Maps, Google Maps, or the user's preferred navigation app performs turn-by-turn routing.

## Core rule
Never pretend a straight GPX segment is a drivable road. Display it as an overview connection unless a road-snapped geometry source has been explicitly verified.

## Location types
- destination: overnight city or major anchor
- lodging: the booked hotel for a night; day routes start and end here
- park_entry: gate or primary access point
- visitor_center: reliable orientation and services
- viewpoint: short scenic stop
- trailhead: hike starting point
- wildlife_zone: broad observation area, not a guaranteed sighting
- fuel: strategic fuel area
- emergency: ranger, hospital, or fallback location

## Confidence
- exact: verified facility or named feature coordinates
- high: established map feature, suitable for launch links
- approximate: broad area marker; app must label it accordingly
