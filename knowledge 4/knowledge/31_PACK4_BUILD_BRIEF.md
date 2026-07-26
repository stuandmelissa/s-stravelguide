# Pack 4 Build Brief

Implement the road-operations layer after Packs 1–3 are loaded.

## Required Features
1. Hotels screen with nightly cards and booking-status badges.
2. Packing checklist with persistent local completion state.
3. Offline readiness panel for maps, itinerary, reservations, and device charging.
4. Reservations screen that distinguishes confirmed from merely planned.
5. Emergency screen with large, accessible actions.
6. Food and treat recommendations that respect time, location, and traveler preferences.
7. Local-first storage for checklist state, notes, completed stops, and memories.

## Required Components
HotelCard
BookingStatusBadge
PackingGroup
ChecklistItem
OfflineReadinessCard
ReservationCard
EmergencyAction
FuelReminder
MealRecommendationCard

## Acceptance Criteria
- Works at 375px width without horizontal scrolling.
- All primary touch targets are at least 44px.
- Main trip content works in airplane mode after first load.
- No backend is required.
- Unknown reservation data is visibly marked, never guessed.
- The current day remains the fastest path from app launch.
