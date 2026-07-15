import { Star } from "lucide-react";
import { formatCompact } from "@/lib/format";
import { cn } from "@/lib/utils";

export function Rating({
  rating,
  reviewsCount,
  className,
}: {
  rating: number;
  reviewsCount?: number;
  className?: string;
}) {
  return (
    <span
      className={cn("inline-flex items-center gap-1 text-sm tabular-nums", className)}
      aria-label={`Rated ${rating.toFixed(1)} out of 5${
        reviewsCount ? ` from ${reviewsCount} reviews` : ""
      }`}
    >
      <Star className="size-3.5 fill-warning text-warning" aria-hidden />
      <span className="font-medium">{rating.toFixed(1)}</span>
      {reviewsCount != null && (
        <span className="text-muted-foreground">({formatCompact(reviewsCount)})</span>
      )}
    </span>
  );
}
