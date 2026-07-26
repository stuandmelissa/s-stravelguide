import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  booked: { label: "Booked", className: "bg-primary text-primary-foreground" },
  known: { label: "Planned stay", className: "bg-secondary text-secondary-foreground" },
  planned: { label: "To book", className: "border-border bg-transparent text-muted-foreground" },
  confirmed: { label: "Confirmed", className: "bg-primary text-primary-foreground" },
  verify: { label: "Verify before arrival", className: "bg-burnt/15 text-burnt" },
  "not-required": { label: "Not required", className: "border-border bg-transparent text-muted-foreground" },
  cancelled: { label: "Cancelled", className: "border-border bg-transparent text-muted-foreground line-through" },
};

/**
 * Booking/reservation status, always shown honestly:
 * a plan is never presented as a confirmed booking
 * (knowledge/28_RESERVATIONS_AND_PASSES.md).
 */
export function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] ?? {
    label: status,
    className: "border-border bg-transparent text-muted-foreground",
  };
  return <Badge className={cn("rounded-full", style.className)}>{style.label}</Badge>;
}
