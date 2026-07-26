import type { Metadata } from "next";
import { BedDouble } from "lucide-react";

import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatTripDate, tripOperations } from "@/lib/data";

export const metadata: Metadata = { title: "Hotels" };

export default function HotelsPage() {
  const { nights, preferences } = tripOperations;

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">Hotels</h1>
        <p className="text-sm text-muted-foreground">
          Hotels are part of the vacation. Target under $
          {preferences.hotelBudgetTargetUsd}/night,{" "}
          {preferences.preferredHotelPrograms.join(" or ").replace(" Honors", "").replace(" Bonvoy", "")}{" "}
          preferred when value is comparable.
        </p>
      </header>

      <ol className="space-y-3">
        {nights.map((night) => (
          <li key={night.date}>
            <Card>
              <CardContent className="space-y-2 p-5">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {formatTripDate(night.date)}
                  </p>
                  <StatusBadge status={night.status} />
                </div>
                <div className="flex items-center gap-2.5">
                  <BedDouble className="size-4 shrink-0 text-primary" aria-hidden />
                  <div>
                    <p className="font-medium leading-snug">
                      {night.hotel ?? "Hotel to be chosen"}
                    </p>
                    <p className="text-sm text-muted-foreground">{night.city}</p>
                  </div>
                </div>
                {(night.purpose ?? night.notes) && (
                  <p className="text-sm text-muted-foreground">
                    {night.purpose ?? night.notes}
                  </p>
                )}
              </CardContent>
            </Card>
          </li>
        ))}
      </ol>

      <p className="px-1 text-xs text-muted-foreground">
        Booking details shown here come from trip data only — a plan is never
        presented as a confirmed reservation.
      </p>
    </div>
  );
}
