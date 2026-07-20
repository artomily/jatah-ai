import { ShieldCheck, Ticket } from "lucide-react";
import {
  PASS_LABELS,
  formatDateTime,
  formatDuration,
  formatMoney,
  formatRange,
} from "@/lib/format";
import type { Transaction } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

/**
 * The itemized post-run receipt: where every fraction of a cent went.
 * Purely presentational — used in the run modal, transaction details, and
 * landing-page hero art.
 */
export function ReceiptCard({
  txn,
  className,
}: {
  txn: Transaction;
  className?: string;
}) {
  const covered = Boolean(txn.coveredByPassId);

  return (
    <div className={cn("overflow-hidden rounded-xl border bg-card text-sm shadow-card", className)}>
      <div className="flex items-start justify-between gap-3 border-b px-4 py-3">
        <div>
          <p className="font-semibold tracking-tight">Receipt</p>
          <p className="text-xs text-muted-foreground">{formatDateTime(txn.createdAt)}</p>
        </div>
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">
          {txn.id}
        </code>
      </div>

      <div className="px-4 py-3">
        <p className="font-medium">{txn.agentName ?? txn.modelName}</p>
        {txn.taskPrompt && (
          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
            &ldquo;{txn.taskPrompt}&rdquo;
          </p>
        )}
      </div>

      {txn.responseText && (
        <div className="mx-4 mb-3 rounded-lg border bg-muted/40 px-3 py-2.5">
          <p className="pb-1 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
            Model output{txn.liveModelId ? ` · ${txn.liveModelId}` : ""}
          </p>
          <p className="max-h-40 overflow-y-auto text-xs leading-relaxed whitespace-pre-wrap">
            {txn.responseText}
          </p>
        </div>
      )}

      {txn.simulatedFallback && (
        <p className="mx-4 mb-3 rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
          Live call unavailable — this receipt shows a simulated result.
        </p>
      )}

      {txn.breakdown && txn.breakdown.length > 0 && (
        <div className="px-4">
          {covered && (
            <p className="pb-1.5 text-xs text-muted-foreground">
              Provider costs — covered by your pass
            </p>
          )}
          <ul className={cn("flex flex-col gap-1.5", covered && "opacity-60")}>
            {txn.breakdown.map((line) => (
              <li
                key={line.provider}
                className="flex items-baseline justify-between gap-3"
              >
                <span className="text-muted-foreground">{line.label}</span>
                <span className="shrink-0 tabular-nums">{formatMoney(line.amount)}</span>
              </li>
            ))}
          </ul>
          <Separator className="mt-3" />
        </div>
      )}

      <div className="flex items-baseline justify-between gap-3 px-4 py-3">
        <span className="font-medium">Total charged</span>
        <span className="flex items-baseline gap-2">
          {covered && txn.coveredByPassType && (
            <Badge className="translate-y-[-1px] bg-success-soft text-success" variant="secondary">
              <Ticket className="size-3" aria-hidden />
              {PASS_LABELS[txn.coveredByPassType]}
            </Badge>
          )}
          <span className="text-lg font-semibold tracking-tight tabular-nums">
            {formatMoney(txn.amount)}
          </span>
        </span>
      </div>

      {txn.cappedOverrun && txn.estimate && (
        <p className="mx-4 mb-3 flex items-start gap-2 rounded-lg bg-warning-soft px-3 py-2 text-xs font-medium text-warning">
          <ShieldCheck className="mt-px size-3.5 shrink-0" aria-hidden />
          Actual usage exceeded the estimate — you were charged the capped maximum of{" "}
          {formatMoney(txn.estimate.cap)}, not the overage.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t bg-muted/40 px-4 py-2.5 text-xs text-muted-foreground">
        {txn.executionMs != null && (
          <span className="tabular-nums">Execution {formatDuration(txn.executionMs)}</span>
        )}
        {txn.estimate && (
          <span className="tabular-nums">
            Estimated {formatRange(txn.estimate.estMin, txn.estimate.estMax)}
          </span>
        )}
        <span className="ml-auto">Demo settlement — no real charge</span>
      </div>
    </div>
  );
}
