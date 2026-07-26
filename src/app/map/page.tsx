import type { Metadata } from "next";
import { Map as MapIcon, MapPin } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getDayWaypoints, tripDays } from "@/lib/data";

export const metadata: Metadata = { title: "Map" };

export default function MapPage() {
  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">Map</h1>
        <p className="text-sm text-muted-foreground">
          The interactive trip map arrives in v0.2. Until then, launch navigation
          to any stop from here.
        </p>
      </header>

      <Card className="border-dashed">
        <CardContent className="flex items-center gap-3 p-5 text-sm text-muted-foreground">
          <MapIcon className="size-5 shrink-0 text-slate-blue" aria-hidden />
          Route lines are planning aids, not turn-by-turn navigation. Apple Maps or
          Google Maps handles the actual driving.
        </CardContent>
      </Card>

      <div className="space-y-3">
        {tripDays.map((day, i) => {
          const waypoints = getDayWaypoints(day.id);
          return (
            <details
              key={day.id}
              className="group rounded-3xl border border-border bg-card"
            >
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-2 px-5 py-3 [&::-webkit-details-marker]:hidden">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Day {i + 1}</p>
                  <p className="font-medium leading-snug">{day.title}</p>
                </div>
                <Badge className="rounded-full bg-secondary text-secondary-foreground">
                  {waypoints.length} stops
                </Badge>
              </summary>
              <ul className="space-y-1 px-5 pb-4">
                {waypoints.map((waypoint, j) => (
                  <li
                    key={`${waypoint.id}-${j}`}
                    className="flex items-center justify-between gap-2 border-t border-border py-2 first:border-t-0"
                  >
                    <span className="text-sm">
                      {waypoint.name}
                      {waypoint.confidence === "approximate" && (
                        <span className="ml-1.5 text-xs text-muted-foreground">
                          (approximate area)
                        </span>
                      )}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="shrink-0 text-burnt"
                      nativeButton={false}
                      render={
                        <a
                          href={waypoint.appleMaps}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Navigate to ${waypoint.name}`}
                        />
                      }
                    >
                      <MapPin className="size-4" aria-hidden />
                      Go
                    </Button>
                  </li>
                ))}
              </ul>
            </details>
          );
        })}
      </div>
    </div>
  );
}
