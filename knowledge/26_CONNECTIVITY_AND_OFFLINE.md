# Connectivity and Offline Readiness

Assume service will be unreliable in parks and on scenic highways.

## Cache Before Departure
- Full itinerary
- Hotel names, addresses, and phone numbers
- Park maps
- Driving routes and alternates
- Reservation details
- Timed-entry or activity confirmations
- Emergency contacts
- Packing checklist
- Daily cheat sheets

## Offline Behavior
- The app must open without a network connection.
- The current day and next day must be immediately available.
- Completed stops and notes save locally first.
- External links should be clearly labeled as requiring service.
- Never block the main experience behind authentication or a live API.

## Sync Rule
Local state is authoritative while offline. Merge enhancements when service returns without erasing user notes or completed stops.
