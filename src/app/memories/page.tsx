import type { Metadata } from "next";
import { BookHeart } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "Memories" };

export default function MemoriesPage() {
  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">Memories</h1>
        <p className="text-sm text-muted-foreground">What made today special?</p>
      </header>

      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
          <BookHeart className="size-10 text-primary/60" aria-hidden />
          <p className="font-medium">The memory journal arrives in v0.4.</p>
          <p className="text-sm text-muted-foreground">
            Until then, take the photo — and don&apos;t leave right after taking it.
            Spend a moment enjoying the place.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
