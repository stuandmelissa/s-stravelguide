"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { BookHeart, Camera, Heart, Send, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useTripDate } from "@/hooks/use-trip-date";
import { db, type Memory } from "@/lib/db";
import { formatTripDate, getTripDay, tripDays } from "@/lib/data";
import { cn } from "@/lib/utils";

/** Object URL for a Blob, revoked when the blob changes or unmounts. */
function useObjectUrl(blob: Blob | null | undefined): string | null {
  const url = useMemo(() => (blob ? URL.createObjectURL(blob) : null), [blob]);
  useEffect(() => {
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [url]);
  return url;
}

function MemoryPhoto({ memory }: { memory: Memory }) {
  const url = useObjectUrl(memory.photo);
  if (!url) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt=""
      className="max-h-72 w-full rounded-2xl object-cover"
      loading="lazy"
    />
  );
}

function MemoryCard({ memory }: { memory: Memory }) {
  const day = getTripDay(memory.dayId);
  const time = new Date(memory.createdAt).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <Card>
      <CardContent className="space-y-3 p-5">
        <MemoryPhoto memory={memory} />
        {memory.text && <p className="text-sm leading-relaxed">{memory.text}</p>}
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            {day ? `${day.title} · ` : ""}
            {time}
          </p>
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon-lg"
              className="size-11"
              aria-label={memory.favorite ? "Remove from favorites" : "Mark as favorite"}
              aria-pressed={memory.favorite}
              onClick={() => db.memories.update(memory.id, { favorite: !memory.favorite })}
            >
              <Heart
                aria-hidden
                className={cn("size-5", memory.favorite && "fill-burnt text-burnt")}
              />
            </Button>
            <Button
              variant="ghost"
              size="icon-lg"
              className="size-11 text-muted-foreground"
              aria-label="Delete memory"
              onClick={() => {
                if (window.confirm("Delete this memory? This can't be undone.")) {
                  db.memories.delete(memory.id);
                }
              }}
            >
              <Trash2 aria-hidden className="size-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Composer({ dayId }: { dayId: string }) {
  const [text, setText] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const preview = useObjectUrl(photo);

  const canSave = text.trim().length > 0 || photo !== null;

  const save = async () => {
    if (!canSave) return;
    await db.memories.add({
      id: crypto.randomUUID(),
      dayId,
      createdAt: new Date().toISOString(),
      text: text.trim(),
      favorite: false,
      photo: photo ?? undefined,
      photoType: photo?.type,
    });
    setText("");
    setPhoto(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <Card>
      <CardContent className="space-y-3 p-5">
        <label className="sr-only" htmlFor="memory-text">
          What made today special?
        </label>
        <textarea
          id="memory-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What made today special?"
          rows={2}
          className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
        {preview && (
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Photo preview" className="max-h-56 w-full rounded-2xl object-cover" />
            <Button
              variant="secondary"
              size="icon-lg"
              className="absolute right-2 top-2 size-11 shadow"
              aria-label="Remove photo"
              onClick={() => {
                setPhoto(null);
                if (fileRef.current) fileRef.current.value = "";
              }}
            >
              <X aria-hidden />
            </Button>
          </div>
        )}
        <div className="flex items-center justify-between gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
          />
          <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
            <Camera className="size-4" aria-hidden />
            {photo ? "Change photo" : "Add photo"}
          </Button>
          <Button size="sm" disabled={!canSave} onClick={save}>
            <Send className="size-3.5" aria-hidden />
            Save memory
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function MemoriesPage() {
  const tripDate = useTripDate();
  const memories = useLiveQuery(() =>
    db.memories.orderBy("createdAt").reverse().toArray(),
  );

  const grouped = new Map<string, Memory[]>();
  for (const memory of memories ?? []) {
    const list = grouped.get(memory.dayId) ?? [];
    list.push(memory);
    grouped.set(memory.dayId, list);
  }
  // Newest trip day first.
  const dayOrder = [...tripDays].reverse().filter((d) => grouped.has(d.id));

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">Memories</h1>
        <p className="text-sm text-muted-foreground">What made today special?</p>
      </header>

      {tripDate && <Composer dayId={tripDate.currentDay.id} />}

      {memories !== undefined && memories.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
            <BookHeart className="size-10 text-primary/60" aria-hidden />
            <p className="font-medium">No memories yet.</p>
            <p className="text-sm text-muted-foreground">
              A sentence is enough. And after taking the photo, don&apos;t leave
              right away — spend a moment enjoying the place.
            </p>
          </CardContent>
        </Card>
      )}

      {dayOrder.map((day) => (
        <section key={day.id} className="space-y-3">
          <h2 className="px-1 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {formatTripDate(day.date)}
          </h2>
          {grouped.get(day.id)!.map((memory) => (
            <MemoryCard key={memory.id} memory={memory} />
          ))}
        </section>
      ))}
    </div>
  );
}
