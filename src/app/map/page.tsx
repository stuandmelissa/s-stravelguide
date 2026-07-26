"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";

import { TripMap, WaypointSheet } from "@/components/trip-map";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useTripDate } from "@/hooks/use-trip-date";
import { getDayWaypoints, tripDays } from "@/lib/data";
import type { Waypoint } from "@/lib/schemas";
import { cn } from "@/lib/utils";

export default function MapPage() {
  const tripDate = useTripDate();
  const [filter, setFilter] = useState<string | null>(null);
  const [selected, setSelected] = useState<Waypoint | null>(null);

  // Default to the whole route; travelers can jump to the current day.
  const activeFilter = filter ?? "trip";
  const activeDay = tripDays.find((d) => d.id === activeFilter);
  const dayWaypoints = activeDay ? getDayWaypoints(activeDay.id) : [];

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">Map</h1>
        <p className="text-sm text-muted-foreground">
          Dashed lines show the trip sequence, not driving directions — Apple
          Maps or Google Maps handles the roads.
        </p>
      </header>

      <div
        className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]"
        role="tablist"
        aria-label="Map day filter"
      >
        <FilterChip
          label="Whole route"
          active={activeFilter === "trip"}
          onClick={() => setFilter("trip")}
        />
        {tripDays.map((day, i) => (
          <FilterChip
            key={day.id}
            label={
              tripDate?.currentDay.id === day.id ? `Day ${i + 1} · today` : `Day ${i + 1}`
            }
            active={activeFilter === day.id}
            onClick={() => setFilter(day.id)}
          />
        ))}
      </div>

      <TripMap dayFilter={activeFilter} onSelectWaypoint={setSelected} />

      {activeDay ? (
        <Card>
          <CardContent className="space-y-1 p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {activeDay.title}
            </p>
            <ul>
              {dayWaypoints.map((waypoint, i) => (
                <li
                  key={`${waypoint.id}-${i}`}
                  className="flex items-center justify-between gap-2 border-t border-border py-1.5 first:border-t-0"
                >
                  <button
                    type="button"
                    className="min-h-11 flex-1 text-left text-sm hover:text-primary"
                    onClick={() => setSelected(waypoint)}
                  >
                    {waypoint.name}
                    {waypoint.confidence === "approximate" && (
                      <span className="ml-1.5 text-xs text-muted-foreground">
                        (approximate area)
                      </span>
                    )}
                  </button>
                  <Button
                    nativeButton={false}
                    size="sm"
                    variant="ghost"
                    className="shrink-0 text-burnt"
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
          </CardContent>
        </Card>
      ) : (
        <p className="px-1 text-xs text-muted-foreground">
          Pick a day to see its stops, or tap any pin for details and navigation.
        </p>
      )}

      {selected && <WaypointSheet waypoint={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "min-h-11 shrink-0 rounded-full border px-4 text-sm font-medium transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
    </button>
  );
}
