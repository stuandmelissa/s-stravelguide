import type { Park, ParkStop } from "./schemas";

/**
 * The park decision engine (knowledge/40_PARK_DECISION_ENGINE.md), as a pure
 * function over the pack 5 stop scores. It recommends, never promises:
 * wildlife and parking are probabilities, and the traveler is never guilted.
 */

export type EngineMode = "on_plan" | "swap" | "bonus" | "rest";

export interface Recommendation {
  mode: EngineMode;
  stop: ParkStop | null;
  /** Honest, calm explanation of why this is the next best experience. */
  reason: string;
  /** Suggested alternative when the primary carries a known risk. */
  alternative?: ParkStop;
}

export type StopStatusMap = ReadonlyMap<string, string>;

const PRIORITY_RANK: Record<ParkStop["priority"], number> = {
  hero: 0,
  core: 1,
  bonus: 2,
  swap: 3,
};

function isDone(states: StopStatusMap, stopId: string): boolean {
  const s = states.get(stopId);
  return s === "completed" || s === "skipped";
}

/** Stops still on the table, in route order, primaries before swaps. */
export function remainingStops(park: Park, states: StopStatusMap): ParkStop[] {
  return park.stops
    .filter((s) => !isDone(states, s.id))
    .sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]);
}

function swapAlternativeFor(park: Park, states: StopStatusMap): ParkStop | undefined {
  return park.stops.find((s) => s.priority === "swap" && !isDone(states, s.id));
}

export function recommendNext(
  park: Park,
  states: StopStatusMap,
  hourOfDay: number,
): Recommendation {
  const remaining = remainingStops(park, states);
  const primaries = remaining.filter((s) => s.priority === "hero" || s.priority === "core");
  const bonuses = remaining.filter((s) => s.priority === "bonus");

  if (primaries.length === 0) {
    if (bonuses.length > 0) {
      const bonus = bonuses[0];
      return {
        mode: "bonus",
        stop: bonus,
        reason:
          `Every must-see here is done. ${bonus.name} is a bonus — add it only if ` +
          "the day still feels roomy. Slowing down is just as good a choice.",
      };
    }
    return {
      mode: "rest",
      stop: null,
      reason:
        "You've seen the best of this park. Nothing left to chase — enjoy a treat, " +
        "take in the view, and head out when it feels right.",
    };
  }

  // Route order within the same priority class preserves continuity;
  // heroes are protected first (preserve order: safety > hero > continuity).
  const next = primaries.sort(
    (a, b) =>
      PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] ||
      park.stops.indexOf(a) - park.stops.indexOf(b),
  )[0];

  const reasons: string[] = [];
  if (next.priority === "hero") {
    reasons.push("This is one of the defining experiences of the trip");
  } else {
    reasons.push("The remaining heroes are done — this is the best of the rest");
  }
  if (next.scenicScore >= 9) reasons.push(`scenery rates ${next.scenicScore}/10`);
  if (next.photoScore >= 9) reasons.push(`photo value ${next.photoScore}/10`);
  if (next.wildlifeScore >= 8)
    reasons.push("wildlife is possible here (never guaranteed)");
  reasons.push(`plan about ${next.durationMinutes} minutes`);

  // High parking friction later in the morning suggests the mapped alternative.
  const alternative = swapAlternativeFor(park, states);
  if (next.parkingRisk >= 8 && hourOfDay >= 9 && alternative) {
    return {
      mode: "swap",
      stop: next,
      alternative,
      reason:
        `${reasons.join(", ")}. Parking runs tight by this hour (risk ` +
        `${next.parkingRisk}/10) — if the lot is full, ${alternative.name} is the ` +
        "planned alternative rather than circling.",
    };
  }

  return { mode: "on_plan", stop: next, reason: `${reasons.join(", ")}.` };
}
