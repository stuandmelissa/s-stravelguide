"use client";

import Link from "next/link";
import { ArrowRight, BedDouble, Car, ListChecks, Moon } from "lucide-react";

import { StatusBadge } from "@/components/status-badge";
import { WeatherChip } from "@/components/weather-chip";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useTripDate } from "@/hooks/use-trip-date";
import {
  formatDrive,
  formatTripDate,
  getDayDriveTotals,
  getNight,
  tripDays,
  tripDaysFile,
} from "@/lib/data";

export default function HomePage() {
  const tripDate = useTripDate();

  if (!tripDate) {
    return (
      <div className="space-y-4" aria-busy>
        <div className="h-8 w-48 animate-pulse rounded-lg bg-muted" />
        <div className="h-56 animate-pulse rounded-3xl bg-muted" />
        <div className="h-28 animate-pulse rounded-3xl bg-muted" />
      </div>
    );
  }

  const { phase, currentDay } = tripDate;
  const dayNumber = tripDays.findIndex((d) => d.id === currentDay.id) + 1;
  const night = getNight(currentDay.date);

  const contextLine =
    phase === "before"
      ? `The adventure begins ${formatTripDate(tripDaysFile.startDate)}.`
      : phase === "after"
        ? "What a trip. Time to relive it."
        : `Day ${dayNumber} of ${tripDays.length}`;

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <p className="text-sm font-medium text-muted-foreground">{contextLine}</p>
        <h1 className="text-3xl font-semibold tracking-tight">
          {formatTripDate(currentDay.date)}
        </h1>
        <WeatherChip date={currentDay.date} />
      </header>

      {/* HeroCard: what should we do today? */}
      <Card className="overflow-hidden border-none bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg">
        <CardContent className="space-y-4 p-6">
          <div className="space-y-1.5">
            <h2 className="text-2xl font-semibold leading-tight">{currentDay.title}</h2>
            {currentDay.heroMoment && (
              <p className="text-sm font-medium text-primary-foreground/90">
                Today&apos;s hero: {currentDay.heroMoment}
              </p>
            )}
          </div>
          <p className="text-sm leading-relaxed text-primary-foreground/85">
            {currentDay.summary}
          </p>
          <Button
            size="lg"
            className="w-full bg-cream font-semibold text-charcoal hover:bg-cream/90 dark:bg-charcoal dark:text-cream dark:hover:bg-charcoal/90"
            nativeButton={false}
            render={<Link href="/today" />}
          >
            Open today&apos;s plan
            <ArrowRight aria-hidden />
          </Button>
        </CardContent>
      </Card>

      {/* Tonight */}
      <Card>
        <CardContent className="space-y-3 p-5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Moon className="size-4 text-slate-blue" aria-hidden />
              Tonight
            </div>
            {night && <StatusBadge status={night.status} />}
          </div>
          {night ? (
            <div className="space-y-1">
              <p className="text-lg font-medium">{night.hotel ?? "Hotel to be chosen"}</p>
              <p className="text-sm text-muted-foreground">{night.city}</p>
              {(night.breakfast ?? night.parking) && (
                <p className="text-sm text-muted-foreground">
                  {[
                    night.breakfast,
                    night.parking &&
                      (night.parking === "Free" ? "free parking" : `parking ${night.parking}`),
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              )}
              {(night.purpose ?? night.notes) && (
                <p className="text-sm text-muted-foreground">{night.purpose ?? night.notes}</p>
              )}
            </div>
          ) : (
            <p className="text-lg font-medium">Home sweet home.</p>
          )}
        </CardContent>
      </Card>

      {/* Drive */}
      <Card>
        <CardContent className="flex items-start gap-3 p-5">
          <Car className="mt-0.5 size-4 shrink-0 text-burnt" aria-hidden />
          <div className="space-y-1">
            <p className="text-sm font-semibold">
              The drive
              {getDayDriveTotals(currentDay.id).miles > 0 &&
                ` · ${formatDrive(getDayDriveTotals(currentDay.id))}`}
            </p>
            <p className="text-sm text-muted-foreground">{currentDay.driveSummary}</p>
            {getDayDriveTotals(currentDay.id).miles > 0 && (
              <p className="text-xs text-muted-foreground">
                Estimate without traffic or stops.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          size="lg"
          className="h-auto flex-col gap-1.5 py-4"
          nativeButton={false}
          render={<Link href="/hotels" />}
        >
          <BedDouble className="size-5 text-primary" aria-hidden />
          Hotels
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="h-auto flex-col gap-1.5 py-4"
          nativeButton={false}
          render={<Link href="/packing" />}
        >
          <ListChecks className="size-5 text-primary" aria-hidden />
          Packing
        </Button>
      </div>

      {phase === "during" && (
        <div className="space-y-2 px-1 pt-1">
          <div className="flex justify-between text-xs font-medium text-muted-foreground">
            <span>Trip progress</span>
            <span>
              Day {dayNumber} of {tripDays.length}
            </span>
          </div>
          <Progress value={(dayNumber / tripDays.length) * 100} />
        </div>
      )}
    </div>
  );
}
