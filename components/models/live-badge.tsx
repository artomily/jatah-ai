import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * The honesty marker for the demo: models with a `liveModelId` return real
 * output through OpenRouter's free tier; the rest simulate the billing flow.
 */
export function LiveBadge({
  live,
  className,
}: {
  live: boolean;
  className?: string;
}) {
  return live ? (
    <Badge
      variant="secondary"
      className={cn("bg-success-soft text-success", className)}
      title="Test calls return real model output (OpenRouter free tier)"
    >
      <span className="size-1.5 animate-pulse rounded-full bg-current" aria-hidden />
      Live
    </Badge>
  ) : (
    <Badge
      variant="secondary"
      className={cn("text-muted-foreground", className)}
      title="Test calls return simulated output — billing flow is identical"
    >
      Simulated
    </Badge>
  );
}
