"use client";

import { useEffect, useState } from "react";
import { CloudOff, Wifi } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { formatTripDate, parkIntelligence } from "@/lib/data";

export function OfflineStatus() {
  const [online, setOnline] = useState<boolean | null>(null);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  return (
    <Card className={online === false ? "border-burnt/40 bg-burnt/5" : undefined}>
      <CardContent className="flex items-start gap-3 p-5">
        {online === false ? (
          <CloudOff className="mt-0.5 size-4 shrink-0 text-burnt" aria-hidden />
        ) : (
          <Wifi className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
        )}
        <div className="space-y-1 text-sm">
          <p className="font-semibold">
            {online === false ? "Offline — and that's fine" : "Ready for offline"}
          </p>
          <p className="text-muted-foreground">
            The itinerary, hotels, confirmations, park guidance, and your notes
            live on this device. Trip data verified{" "}
            {formatTripDate(parkIntelligence.generatedAt)}; the offline copy never
            reflects current road status or closures.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
