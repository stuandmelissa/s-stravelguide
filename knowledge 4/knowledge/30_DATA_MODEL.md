# Operational Data Model

## Trip
id, title, travelers, startDate, endDate, homeLocation, vehicle, status

## Day
id, date, title, overnightCity, heroMoment, summary, departureTarget, arrivalGoal, driveMinutes, notes

## Stop
id, dayId, name, category, priority, latitude, longitude, durationMinutes, bestTime, description, status, offlineNotes

## Hotel
id, dayId, name, brand, address, phone, checkIn, checkOut, bookingStatus, confirmationNumber, parkingNotes, breakfastNotes

## Reservation
id, dayId, type, provider, title, startTime, status, confirmationNumber, sourceUrl, lastVerifiedAt

## RouteLeg
id, dayId, fromStopId, toStopId, distanceMiles, driveMinutes, scenic, fuelRisk, offlineMapKey

## Recommendation
id, dayId, type, title, reason, confidence, action, generatedAt, expiresAt

## Memory
id, dayId, stopId, createdAt, text, photoRefs, favorite, synced

## State Rules
- IDs are stable strings.
- Dates use ISO 8601.
- Time zone is stored with each timed item.
- User-entered fields are never overwritten by refreshed reference data.
- Unknown values remain null; never fabricate them.
