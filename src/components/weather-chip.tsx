"use client";

import { createElement, useEffect } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  Sun,
  type LucideIcon,
} from "lucide-react";

import { db } from "@/lib/db";
import { refreshForecasts, weatherLabel } from "@/lib/weather";
import { cn } from "@/lib/utils";

function iconFor(code: number): LucideIcon {
  if (code === 0) return Sun;
  if (code <= 2) return CloudSun;
  if (code === 3) return Cloud;
  if (code <= 48) return CloudFog;
  if (code <= 57) return CloudDrizzle;
  if (code <= 67) return CloudRain;
  if (code <= 77) return CloudSnow;
  if (code <= 82) return CloudRain;
  if (code <= 86) return CloudSnow;
  return CloudLightning;
}

/** Latest cached forecast for a date, refreshing in the background online. */
export function WeatherChip({ date, className }: { date: string; className?: string }) {
  const forecast = useLiveQuery(() => db.weather.get(date), [date]);

  useEffect(() => {
    refreshForecasts();
  }, [date]);

  if (!forecast) return null;

  const icon = createElement(iconFor(forecast.weatherCode), {
    className: "size-4 shrink-0 text-slate-blue",
    "aria-hidden": true,
  });
  const asOf = new Date(forecast.fetchedAt).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <p
      className={cn(
        "flex flex-wrap items-center gap-x-1.5 text-sm text-muted-foreground",
        className,
      )}
      title={`Forecast as of ${asOf}`}
    >
      {icon}
      <span>
        {weatherLabel(forecast.weatherCode)} · {forecast.highF}°/{forecast.lowF}°
        {forecast.precipPct >= 15 && ` · ${forecast.precipPct}% rain`}
      </span>
      <span className="text-xs">(as of {asOf})</span>
    </p>
  );
}
