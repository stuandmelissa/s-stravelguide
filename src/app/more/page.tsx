import type { Metadata } from "next";
import Link from "next/link";
import { BedDouble, ChevronRight, ClipboardCheck, ListChecks } from "lucide-react";

import { OfflineStatus } from "@/components/offline-status";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatTripDate, tripDaysFile, tripOperations } from "@/lib/data";

export const metadata: Metadata = { title: "More" };

const LINKS = [
  { href: "/hotels", label: "Hotels", description: "Every night of the trip", icon: BedDouble },
  { href: "/packing", label: "Packing", description: "Checklists and nightly reset", icon: ListChecks },
] as const;

export default function MorePage() {
  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">More</h1>
        <p className="text-sm text-muted-foreground">
          {formatTripDate(tripDaysFile.startDate)} – {formatTripDate(tripDaysFile.endDate)}
        </p>
      </header>

      <Card>
        <CardContent className="p-2">
          <ul>
            {LINKS.map(({ href, label, description, icon: Icon }) => (
              <li key={href} className="border-t border-border first:border-t-0">
                <Link
                  href={href}
                  className="flex min-h-14 items-center gap-3 rounded-xl px-3 py-2 transition-colors hover:bg-accent"
                >
                  <Icon className="size-5 shrink-0 text-primary" aria-hidden />
                  <span className="flex-1">
                    <span className="block font-medium">{label}</span>
                    <span className="block text-sm text-muted-foreground">{description}</span>
                  </span>
                  <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 px-1 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          <ClipboardCheck className="size-4" aria-hidden />
          Reservations to track
        </h2>
        <Card>
          <CardContent className="p-5">
            <ul className="space-y-4">
              {tripOperations.reservations.map((reservation) => (
                <li key={reservation.title} className="space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-medium">{reservation.title}</span>
                    <StatusBadge status={reservation.status} />
                  </div>
                  {(reservation.date ?? reservation.location) && (
                    <p className="text-xs text-muted-foreground">
                      {[
                        reservation.date && formatTripDate(reservation.date),
                        reservation.time,
                        reservation.location,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  )}
                  {reservation.confirmationNumber && (
                    <p className="font-mono text-xs text-foreground/80">
                      Confirmation {reservation.confirmationNumber}
                    </p>
                  )}
                  {reservation.notes && (
                    <p className="text-xs text-muted-foreground">{reservation.notes}</p>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>

      <OfflineStatus />

      <p className="px-1 text-center text-xs text-muted-foreground">
        S&amp;S Travel Guide v0.4 · Adventure at your own pace.
      </p>
    </div>
  );
}
