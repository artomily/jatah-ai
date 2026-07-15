import { ShieldCheck, Ticket } from "lucide-react";
import {
  PASS_LABELS,
  formatDuration,
  formatMoney,
  formatRange,
} from "@/lib/format";
import type { PassType, PerRequestPricing } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * The pre-approval estimate: what this run should cost, what it can never
 * exceed, and how it will be billed. Purely presentational — reused in the run
 * modal and as landing-page hero art.
 */
export function CostEstimateCard({
  estimate,
  executionMsHint,
  coveredByPassType,
  balanceAfterWorstCase,
  className,
}: {
  estimate: PerRequestPricing;
  executionMsHint: number;
  coveredByPassType?: PassType;
  balanceAfterWorstCase?: number;
  className?: string;
}) {
  const covered = coveredByPassType != null;

  return (
    <div className={cn("overflow-hidden rounded-xl border bg-card text-sm shadow-card", className)}>
      <div className="flex items-baseline justify-between gap-3 border-b px-4 py-3">
        <span className="text-muted-foreground">Estimated cost</span>
        <span className={cn("text-lg font-semibold tracking-tight tabular-nums", covered && "text-muted-foreground line-through decoration-1")}>
          {formatRange(estimate.estMin, estimate.estMax)}
        </span>
      </div>

      <dl className="flex flex-col gap-2.5 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <dt className="text-muted-foreground">Maximum charge</dt>
          <dd className={cn("font-medium tabular-nums", covered && "text-muted-foreground line-through decoration-1")}>
            {formatMoney(estimate.cap)}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-muted-foreground">Billing</dt>
          <dd className="font-medium">
            {covered ? PASS_LABELS[coveredByPassType] : "Pay per request"}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-muted-foreground">Est. execution</dt>
          <dd className="font-medium tabular-nums">~{formatDuration(executionMsHint)}</dd>
        </div>
        {!covered && balanceAfterWorstCase != null && (
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">Balance after (worst case)</dt>
            <dd className="font-medium tabular-nums">{formatMoney(balanceAfterWorstCase)}</dd>
          </div>
        )}
      </dl>

      <p
        className={cn(
          "flex items-center gap-2 border-t px-4 py-2.5 text-xs font-medium",
          covered ? "bg-success-soft text-success" : "bg-muted/40 text-muted-foreground",
        )}
      >
        {covered ? (
          <>
            <Ticket className="size-3.5" aria-hidden />
            Covered by your {PASS_LABELS[coveredByPassType]} — this run is included.
          </>
        ) : (
          <>
            <ShieldCheck className="size-3.5" aria-hidden />
            You&apos;ll never pay more than {formatMoney(estimate.cap)} for this run.
          </>
        )}
      </p>
    </div>
  );
}
