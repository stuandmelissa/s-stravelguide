"use client";

import { useLiveQuery } from "dexie-react-hooks";
import {
  Camera,
  Check,
  CircleParking,
  Clock,
  ExternalLink,
  Mountain,
  PawPrint,
  RotateCcw,
  Sparkles,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { db, setStopStatus } from "@/lib/db";
import { formatTripDate, getPark, getParkSources } from "@/lib/data";
import { recommendNext } from "@/lib/recommend";
import type { ParkStop } from "@/lib/schemas";
import { cn } from "@/lib/utils";

const PRIORITY_STYLES: Record<ParkStop["priority"], { label: string; className: string }> = {
  hero: { label: "Hero", className: "bg-primary text-primary-foreground" },
  core: { label: "Core", className: "bg-secondary text-secondary-foreground" },
  bonus: { label: "Bonus", className: "border-border bg-transparent text-muted-foreground" },
  swap: { label: "Alternative", className: "bg-slate-blue/15 text-slate-blue" },
};

function ScorePills({ stop }: { stop: ParkStop }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
      <span className="flex items-center gap-1">
        <Clock className="size-3" aria-hidden />
        {stop.durationMinutes} min · {stop.difficulty}
      </span>
      <span className="flex items-center gap-1">
        <Mountain className="size-3" aria-hidden />
        {stop.scenicScore}/10
      </span>
      <span className="flex items-center gap-1">
        <Camera className="size-3" aria-hidden />
        {stop.photoScore}/10
      </span>
      {stop.wildlifeScore >= 7 && (
        <span className="flex items-center gap-1">
          <PawPrint className="size-3" aria-hidden />
          {stop.wildlifeScore}/10
        </span>
      )}
      {stop.parkingRisk >= 8 && (
        <span className="flex items-center gap-1 text-burnt">
          <CircleParking className="size-3" aria-hidden />
          parking tight
        </span>
      )}
    </div>
  );
}

function ParkStopRow({
  dayId,
  stop,
  status,
}: {
  dayId: string;
  stop: ParkStop;
  status: string | undefined;
}) {
  const done = status === "completed";
  const skipped = status === "skipped";

  return (
    <li className={cn("space-y-2 py-3", skipped && "opacity-55")}>
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <p className={cn("font-medium leading-snug", skipped && "line-through")}>
            {stop.name}
          </p>
          <ScorePills stop={stop} />
        </div>
        <Badge className={cn("shrink-0 rounded-full", PRIORITY_STYLES[stop.priority].className)}>
          {PRIORITY_STYLES[stop.priority].label}
        </Badge>
      </div>
      {stop.notes && <p className="text-xs text-muted-foreground">{stop.notes}</p>}
      {stop.skipWhen && !done && !skipped && (
        <p className="text-xs text-muted-foreground">
          <span className="font-medium">Skip when:</span> {stop.skipWhen}
        </p>
      )}
      <div className="flex gap-2">
        <Button
          size="sm"
          variant={done ? "secondary" : "outline"}
          onClick={() => setStopStatus(dayId, stop.id, done ? null : "completed")}
        >
          <Check className="size-3.5" aria-hidden />
          {done ? "Done — undo" : "We did it"}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="text-muted-foreground"
          onClick={() => setStopStatus(dayId, stop.id, skipped ? null : "skipped")}
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
      </div>
    </li>
  );
}

export function ParkSection({ dayId, parkId }: { dayId: string; parkId: string }) {
  const park = getPark(parkId);
  const sources = getParkSources(parkId);
  const states = useLiveQuery(
    () => db.stopStates.where("dayId").equals(dayId).toArray(),
    [dayId],
  );
  const statusMap = new Map((states ?? []).map((s) => [s.waypointId, s.status as string]));
  const rec = recommendNext(park, statusMap, new Date().getHours());

  return (
    <section className="space-y-3">
      <h2 className="px-1 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {park.name}
      </h2>

      {/* What should we do next? */}
      <Card className="border-primary/25 bg-primary/5">
        <CardContent className="space-y-2 p-5">
          <p className="flex items-center gap-2 text-sm font-semibold text-primary">
            <Sparkles className="size-4" aria-hidden />
            {rec.stop ? `Next: ${rec.stop.name}` : "Nothing left to chase"}
            {rec.alternative && ` (or ${rec.alternative.name})`}
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">{rec.reason}</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <p className="text-sm text-muted-foreground">{park.hero}</p>
          <Separator className="my-3" />
          <ul className="divide-y divide-border">
            {park.stops.map((stop) => (
              <ParkStopRow
                key={stop.id}
                dayId={dayId}
                stop={stop}
                status={statusMap.get(stop.id)}
              />
            ))}
          </ul>
          {park.volatile && (
            <>
              <Separator className="my-3" />
              <div className="space-y-2">
                <Badge className="rounded-full bg-burnt/15 text-burnt">
                  Verified {formatTripDate(park.verifiedAt)}
                </Badge>
                <p className="text-xs text-muted-foreground">
                  Hours, access rules, and closures change. When you have service,
                  check the official sources:
                </p>
                <ul className="space-y-1">
                  {sources.map((source) => (
                    <li key={source.id}>
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-8 items-center gap-1.5 text-xs font-medium text-slate-blue underline-offset-2 hover:underline"
                      >
                        <ExternalLink className="size-3" aria-hidden />
                        {source.id.replaceAll("-", " ")} (needs service)
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
