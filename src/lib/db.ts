import Dexie, { type EntityTable } from "dexie";

/**
 * Local-first storage (knowledge/26_CONNECTIVITY_AND_OFFLINE.md):
 * local state is authoritative while offline and is never blocked
 * behind a network call.
 */

export type StopStatus = "completed" | "skipped";

export interface StopState {
  /** `${dayId}:${waypointId}` */
  id: string;
  dayId: string;
  waypointId: string;
  status: StopStatus;
  updatedAt: string;
}

export interface ChecklistState {
  /** `${groupId}:${item}` */
  id: string;
  groupId: string;
  item: string;
  checked: boolean;
  updatedAt: string;
}

export interface Memory {
  id: string;
  /** Trip day the memory belongs to (dayId, e.g. "day03"). */
  dayId: string;
  createdAt: string;
  text: string;
  favorite: boolean;
  photo?: Blob;
  photoType?: string;
}

export const db = new Dexie("ss-travel-guide") as Dexie & {
  stopStates: EntityTable<StopState, "id">;
  checklist: EntityTable<ChecklistState, "id">;
  memories: EntityTable<Memory, "id">;
};

db.version(1).stores({
  stopStates: "id, dayId",
  checklist: "id, groupId",
});

db.version(2).stores({
  stopStates: "id, dayId",
  checklist: "id, groupId",
  memories: "id, dayId, createdAt",
});

export function stopStateId(dayId: string, waypointId: string): string {
  return `${dayId}:${waypointId}`;
}

export function checklistId(groupId: string, item: string): string {
  return `${groupId}:${item}`;
}

/** Cycle a stop through pending -> completed -> skipped -> pending. */
export async function setStopStatus(
  dayId: string,
  waypointId: string,
  status: StopStatus | null,
): Promise<void> {
  const id = stopStateId(dayId, waypointId);
  if (status === null) {
    await db.stopStates.delete(id);
    return;
  }
  await db.stopStates.put({
    id,
    dayId,
    waypointId,
    status,
    updatedAt: new Date().toISOString(),
  });
}

export async function setChecklistItem(
  groupId: string,
  item: string,
  checked: boolean,
): Promise<void> {
  await db.checklist.put({
    id: checklistId(groupId, item),
    groupId,
    item,
    checked,
    updatedAt: new Date().toISOString(),
  });
}
