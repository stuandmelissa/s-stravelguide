import { db, type WeatherDay } from "./db";
import { getDayWaypoints, toLocalIsoDate, tripDays } from "./data";
import type { Waypoint } from "./schemas";

/**
 * Daily forecasts from Open-Meteo (free, keyless), cached locally so the
 * last fetch stays visible offline — always with its "as of" time.
 */

const STALE_MS = 3 * 60 * 60 * 1000;
const HORIZON_DAYS = 15;

/** Where the day is actually spent: the first activity stop, else the anchor. */
export function dayWeatherLocation(dayId: string): Waypoint | null {
  const waypoints = getDayWaypoints(dayId);
  if (waypoints.length === 0) return null;
  return waypoints.find((w, i) => i > 0 && w.type !== "lodging") ?? waypoints[waypoints.length - 1];
}

function withinForecastHorizon(date: string, today: string): boolean {
  const d = (iso: string) => new Date(`${iso}T00:00:00`).getTime();
  const diffDays = (d(date) - d(today)) / 86_400_000;
  return diffDays >= 0 && diffDays <= HORIZON_DAYS;
}

async function fetchDay(date: string, spot: Waypoint): Promise<WeatherDay | null> {
  const params = new URLSearchParams({
    latitude: String(spot.latitude),
    longitude: String(spot.longitude),
    daily: "temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code",
    temperature_unit: "fahrenheit",
    timezone: "auto",
    start_date: date,
    end_date: date,
  });
  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
  if (!res.ok) return null;
  const json = (await res.json()) as {
    daily?: {
      temperature_2m_max: number[];
      temperature_2m_min: number[];
      precipitation_probability_max: (number | null)[];
      weather_code: number[];
    };
  };
  const daily = json.daily;
  if (!daily || daily.temperature_2m_max.length === 0) return null;
  return {
    id: date,
    date,
    latitude: spot.latitude,
    longitude: spot.longitude,
    highF: Math.round(daily.temperature_2m_max[0]),
    lowF: Math.round(daily.temperature_2m_min[0]),
    precipPct: Math.round(daily.precipitation_probability_max[0] ?? 0),
    weatherCode: daily.weather_code[0],
    fetchedAt: new Date().toISOString(),
  };
}

let refreshInFlight: Promise<void> | null = null;

/** Refresh stale/missing forecasts for upcoming trip days (no-op offline). */
export function refreshForecasts(): Promise<void> {
  refreshInFlight ??= (async () => {
    try {
      if (typeof navigator !== "undefined" && !navigator.onLine) return;
      const today = toLocalIsoDate(new Date());
      const now = Date.now();
      for (const day of tripDays) {
        if (!withinForecastHorizon(day.date, today)) continue;
        const cached = await db.weather.get(day.date);
        if (cached && now - new Date(cached.fetchedAt).getTime() < STALE_MS) continue;
        const spot = dayWeatherLocation(day.id);
        if (!spot) continue;
        const fresh = await fetchDay(day.date, spot).catch(() => null);
        if (fresh) await db.weather.put(fresh);
      }
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

/** WMO weather code to a short human label. */
export function weatherLabel(code: number): string {
  if (code === 0) return "Sunny";
  if (code <= 2) return "Partly cloudy";
  if (code === 3) return "Overcast";
  if (code <= 48) return "Fog";
  if (code <= 57) return "Drizzle";
  if (code <= 67) return "Rain";
  if (code <= 77) return "Snow";
  if (code <= 82) return "Showers";
  if (code <= 86) return "Snow showers";
  return "Thunderstorms";
}
