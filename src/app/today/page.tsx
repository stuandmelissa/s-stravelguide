"use client";

import { useState } from "react";
import { Car, ChevronLeft, ChevronRight, Moon, Sparkles } from "lucide-react";

import { ParkSection } from "@/components/park-section";
import { StopList } from "@/components/stop-list";
import { WeatherChip } from "@/components/weather-chip";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useTripDate } from "@/hooks/use-trip-date";
import {
  formatDrive,
  formatTripDate,
  getDayDriveTotals,
  getNight,
  tripDays,
} from "@/lib/data";

export default function TodayPage() {
  const tripDate = useTripDate();
  // null means "follow the current trip day"; set when the user browses.
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null);

  const dayIndex =
    selectedDayId !== null
      ? tripDays.findIndex((d) => d.id === selectedDayId)
      : tripDate
        ? tripDays.findIndex((d) => d.id === tripDate.currentDay.id)
        : null;

  if (dayIndex === null) {
    return (
      <div className="space-y-4" aria-busy>
        <div className="h-8 w-56 animate-pulse rounded-lg bg-muted" />
        <div className="h-40 animate-pulse rounded-3xl bg-muted" />
        <div className="h-72 animate-pulse rounded-3xl bg-muted" />
      </div>
    );
  }

  const day = tripDays[dayIndex];
  const night = getNight(day.date);
  const isCurrent = tripDate?.currentDay.id === day.id;
  const driveTotals = getDayDriveTotals(day.id);

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between gap-2">
        <Button
          variant="ghost"
          size="icon-lg"
          className="size-11"
          aria-label="Previous day"
          disabled={dayIndex === 0}
          onClick={() => setSelectedDayId(tripDays[dayIndex - 1].id)}
        >
          <ChevronLeft aria-hidden />
        </Button>
        <div className="min-w-0 text-center">
          <p className="text-xs font-medium text-muted-foreground">
            Day {dayIndex + 1} of {tripDays.length}
            {isCurrent && " · today"}
          </p>
          <h1 className="truncate text-lg font-semibold tracking-tight">
            {formatTripDate(day.date)}
          </h1>
        </div>
        <Button
          variant="ghost"
          size="icon-lg"
          className="size-11"
          aria-label="Next day"
          disabled={dayIndex === tripDays.length - 1}
          onClick={() => setSelectedDayId(tripDays[dayIndex + 1].id)}
        >
          <ChevronRight aria-hidden />
        </Button>
      </header>

      <Card>
        <CardContent className="space-y-3 p-5">
          <h2 className="text-xl font-semibold leading-tight">{day.title}</h2>
          {day.heroMoment && (
            <p className="flex items-start gap-2 text-sm font-medium text-primary">
              <Sparkles className="mt-0.5 size-4 shrink-0" aria-hidden />
              {day.heroMoment}
            </p>
          )}
          <p className="text-sm leading-relaxed text-muted-foreground">{day.summary}</p>
          <WeatherChip date={day.date} />
          <Separator />
          <div className="space-y-1">
            <p className="flex items-start gap-2 text-sm text-muted-foreground">
              <Car className="mt-0.5 size-4 shrink-0 text-burnt" aria-hidden />
              {day.driveSummary}
            </p>
            {driveTotals.miles > 0 && (
              <p className="pl-6 text-xs text-muted-foreground">
                {formatDrive(driveTotals)} total driving (est., without traffic or stops)
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {!isCurrent && tripDate && (
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => setSelectedDayId(tripDate.currentDay.id)}
        >
          Back to today
        </Button>
      )}

      {day.parkIds.map((parkId) => (
        <ParkSection key={parkId} dayId={day.id} parkId={parkId} />
      ))}

      <section className="space-y-3">
        <h2 className="px-1 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          The route
        </h2>
        <Card>
          <CardContent className="p-5">
            <StopList dayId={day.id} />
          </CardContent>
        </Card>
      </section>

      <Card className="bg-secondary/50">
        <CardContent className="flex items-start gap-3 p-5">
          <Moon className="mt-0.5 size-4 shrink-0 text-slate-blue" aria-hidden />
          <div className="space-y-1 text-sm">
            <p className="font-semibold">
              {night
                ? `Tonight: ${night.hotel ?? night.city}`
                : "Tonight: home"}
            </p>
            <p className="text-muted-foreground">{day.eveningNote}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
