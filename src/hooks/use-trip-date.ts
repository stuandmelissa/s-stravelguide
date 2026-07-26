"use client";

import { useEffect, useState } from "react";

import { getCurrentTripDay, getTripPhase, toLocalIsoDate, type TripPhase } from "@/lib/data";
import type { TripDay } from "@/lib/schemas";

export interface TripDate {
  /** Local YYYY-MM-DD on the device. */
  date: string;
  phase: TripPhase;
  /** The trip day the app should focus on right now. */
  currentDay: TripDay;
}

/**
 * Device-local "today", resolved after mount so server and client
 * markup never disagree. Returns null on the first render.
 */
export function useTripDate(): TripDate | null {
  const [tripDate, setTripDate] = useState<TripDate | null>(null);

  useEffect(() => {
    const update = () => {
      const date = toLocalIsoDate(new Date());
      setTripDate({
        date,
        phase: getTripPhase(date),
        currentDay: getCurrentTripDay(date),
      });
    };
    update();
    // Refresh when the app is brought back to the foreground (e.g. next morning).
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);

  return tripDate;
}
