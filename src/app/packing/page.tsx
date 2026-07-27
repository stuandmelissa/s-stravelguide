"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { checklistId, db, setChecklistItem } from "@/lib/db";
import { tripOperations } from "@/lib/data";
import type { PackingGroup } from "@/lib/schemas";

function PackingGroupCard({
  group,
  checkedIds,
}: {
  group: PackingGroup;
  checkedIds: Set<string>;
}) {
  const checkedCount = group.items.filter((item) =>
    checkedIds.has(checklistId(group.id, item)),
  ).length;
  const allDone = checkedCount === group.items.length;

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="font-semibold">{group.title}</h2>
            <p className="text-xs text-muted-foreground">
              {allDone ? "All set." : `${checkedCount} of ${group.items.length} packed`}
            </p>
          </div>
          {checkedCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              onClick={() =>
                Promise.all(
                  group.items.map((item) => setChecklistItem(group.id, item, false)),
                )
              }
            >
              <RotateCcw className="size-3.5" aria-hidden />
              Reset
            </Button>
          )}
        </div>
        <ul className="space-y-1">
          {group.items.map((item) => {
            const id = checklistId(group.id, item);
            const checked = checkedIds.has(id);
            return (
              <li key={id}>
                <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-1.5 transition-colors hover:bg-accent">
                  <Checkbox
                    checked={checked}
                    onCheckedChange={(value) =>
                      setChecklistItem(group.id, item, value === true)
                    }
                  />
                  <span
                    className={
                      checked ? "text-sm text-muted-foreground line-through" : "text-sm"
                    }
                  >
                    {item}
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}

export default function PackingPage() {
  const states = useLiveQuery(() => db.checklist.toArray());
  const checkedIds = new Set(states?.filter((s) => s.checked).map((s) => s.id));

  const groups = tripOperations.packingGroups;
  const totalItems = groups.reduce((sum, g) => sum + g.items.length, 0);
  const totalChecked = groups.reduce(
    (sum, g) =>
      sum + g.items.filter((item) => checkedIds.has(checklistId(g.id, item))).length,
    0,
  );

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">Packing</h1>
        <p className="text-sm text-muted-foreground">
          Packed for temperature swings, early departures, heat, and thin cell service.
        </p>
      </header>

      <div className="space-y-2 px-1">
        <div className="flex justify-between text-xs font-medium text-muted-foreground">
          <span>Overall</span>
          <span>
            {totalChecked} of {totalItems}
          </span>
        </div>
        <Progress value={totalItems === 0 ? 0 : (totalChecked / totalItems) * 100} />
      </div>

      {groups.map((group) => (
        <PackingGroupCard key={group.id} group={group} checkedIds={checkedIds} />
      ))}

      <Card className="bg-secondary/50">
        <CardContent className="space-y-1.5 p-5 text-sm">
          <p className="font-semibold">Nightly reset</p>
          <p className="text-muted-foreground">
            Refill water, charge devices, confirm tomorrow&apos;s offline maps, set out
            layers, restock car snacks, and agree on the departure target.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
