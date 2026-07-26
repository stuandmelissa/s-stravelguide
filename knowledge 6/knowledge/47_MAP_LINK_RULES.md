# Map Link Rules

Use HTTPS universal links whenever possible.

## Apple Maps
`https://maps.apple.com/?daddr=<lat>,<lon>&dirflg=d`

## Google Maps
`https://www.google.com/maps/dir/?api=1&destination=<lat>,<lon>&travelmode=driving`

For multiple stops, construct daily links dynamically and URL-encode waypoint coordinates. If the platform rejects too many waypoints, open the next anchor only and retain the remaining sequence in S&S.

Every external-map action should say exactly what it does: “Navigate to Bear Lake Trailhead,” not “Open map.”
