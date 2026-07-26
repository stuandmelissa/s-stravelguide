import type { Metadata } from "next";
import { BedDouble, CircleParking, Coffee } from "lucide-react";

import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatTripDate, tripOperations } from "@/lib/data";

export const metadata: Metadata = { title: "Hotels" };

export default function HotelsPage() {
  const { nights } = tripOperations;
  const bookedCount = nights.filter((n) => n.status === "booked").length;

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">Hotels</h1>
        <p className="text-sm text-muted-foreground">
          {bookedCount === nights.length
            ? `All ${nights.length} nights are booked. Hotels are part of the vacation.`
            : `${bookedCount} of ${nights.length} nights booked.`}
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
                {(night.breakfast ?? night.parking) && (
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    {night.breakfast && (
                      <span className="flex items-center gap-1.5">
                        <Coffee className="size-3.5 shrink-0 text-burnt" aria-hidden />
                        {night.breakfast}
                      </span>
                    )}
                    {night.parking && (
                      <span className="flex items-center gap-1.5">
                        <CircleParking className="size-3.5 shrink-0 text-slate-blue" aria-hidden />
                        {night.parking === "Free" ? "Free parking" : night.parking}
                      </span>
                    )}
                  </div>
                )}
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
