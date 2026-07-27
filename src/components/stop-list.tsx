"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { Check, MapPin, RotateCcw, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { db, setStopStatus, type StopStatus } from "@/lib/db";
import { getDayWaypoints } from "@/lib/data";
import type { Waypoint } from "@/lib/schemas";
import { cn } from "@/lib/utils";

const TYPE_LABELS: Record<Waypoint["type"], string> = {
  destination: "Destination",
  lodging: "Tonight's hotel",
  park_entry: "Park entry",
  visitor_center: "Visitor center",
  viewpoint: "Viewpoint",
  trailhead: "Trailhead",
  wildlife_zone: "Wildlife area",
  fuel: "Fuel",
  emergency: "Emergency",
};

function StopRow({
  dayId,
  waypoint,
  status,
  isLast,
  isOvernight,
}: {
  dayId: string;
  waypoint: Waypoint;
  status: StopStatus | undefined;
  isLast: boolean;
  isOvernight: boolean;
}) {
  const done = status === "completed";
  const skipped = status === "skipped";

  return (
    <li className="relative flex gap-3">
      {/* timeline rail */}
      <div className="flex flex-col items-center">
        <button
          type="button"
          aria-label={
            done
              ? `${waypoint.name}: completed. Tap to reset.`
              : `${waypoint.name}: mark completed`
          }
          onClick={() => setStopStatus(dayId, waypoint.id, done ? null : "completed")}
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
            done
              ? "border-primary bg-primary text-primary-foreground"
              : skipped
                ? "border-border bg-muted text-muted-foreground"
                : "border-border bg-card text-transparent hover:border-primary",
          )}
        >
          {skipped ? <X className="size-5" aria-hidden /> : <Check className="size-5" aria-hidden />}
        </button>
        {!isLast && <div className="w-0.5 flex-1 bg-border" aria-hidden />}
      </div>

      <div className={cn("flex-1 space-y-2 pb-6", skipped && "opacity-55")}>
        <div className="space-y-0.5 pt-1.5">
          <p className={cn("font-medium leading-snug", skipped && "line-through")}>
            {waypoint.name}
          </p>
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
            <span>{TYPE_LABELS[waypoint.type]}</span>
            {isOvernight && (
              <Badge className="rounded-full bg-secondary text-secondary-foreground">
                Tonight&apos;s stop
              </Badge>
            )}
            {waypoint.confidence === "approximate" && (
              <Badge className="rounded-full border-border bg-transparent text-muted-foreground">
                Approximate area
              </Badge>
            )}
          </div>
        </div>

        {!done && (
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              nativeButton={false}
              render={
                <a href={waypoint.appleMaps} target="_blank" rel="noopener noreferrer" />
              }
            >
              <MapPin className="size-3.5 text-burnt" aria-hidden />
              Navigate to {shortName(waypoint.name)}
            </Button>
            {!isOvernight && (
              <Button
                size="sm"
                variant="ghost"
                className="text-muted-foreground"
                onClick={() => setStopStatus(dayId, waypoint.id, skipped ? null : "skipped")}
              >
                {skipped ? (
                  <>
                    <RotateCcw className="size-3.5" aria-hidden /> Restore
                  </>
                ) : (
                  <>
                    <X className="size-3.5" aria-hidden /> Skip
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </div>
    </li>
  );
}

function shortName(name: string): string {
  return name.split(/[,/]/)[0].trim();
}

export function StopList({ dayId }: { dayId: string }) {
  const all = getDayWaypoints(dayId);
  // The first waypoint is the morning's starting point (hotel or home),
  // not a stop to complete.
  const waypoints =
    all.length > 1 && (all[0].type === "destination" || all[0].type === "lodging")
      ? all.slice(1)
      : all;
  const states = useLiveQuery(
    () => db.stopStates.where("dayId").equals(dayId).toArray(),
    [dayId],
  );
  const statusByWaypoint = new Map(states?.map((s) => [s.waypointId, s.status]));

  if (waypoints.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No mapped stops today. Enjoy the day at your own pace.
      </p>
    );
  }

  const completed = waypoints.filter(
    (w) => statusByWaypoint.get(w.id) === "completed",
  ).length;

  return (
    <div className="space-y-4">
      <p className="text-xs font-medium text-muted-foreground">
        {completed} of {waypoints.length} stops completed
        {completed === waypoints.length && " — beautifully done."}
      </p>
      <ol className="list-none">
        {waypoints.map((waypoint, i) => (
          <StopRow
            key={`${waypoint.id}-${i}`}
            dayId={dayId}
            waypoint={waypoint}
            status={statusByWaypoint.get(waypoint.id)}
            isLast={i === waypoints.length - 1}
            isOvernight={
              i === waypoints.length - 1 &&
              (waypoint.type === "destination" || waypoint.type === "lodging")
            }
          />
        ))}
      </ol>
    </div>
  );
}
