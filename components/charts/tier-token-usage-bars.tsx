import { formatCompact } from "@/lib/format";
import type { AiModel } from "@/lib/types";

const CHART_VARS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

/**
 * Per-model token burn within one tier pass — which model is eating the
 * shared budget fastest. Plain CSS bars, not recharts/SVG: they scale to
 * each other (largest bar = 100%), not to the token limit — how much of the
 * *whole* budget is gone is already shown by the progress bar above this.
 */
export function TierTokenUsageBars({
  models,
  usage,
}: {
  models: AiModel[];
  usage: Array<{ modelId: string; tokens: number }>;
}) {
  const usageMap = new Map(usage.map((u) => [u.modelId, u.tokens]));
  const rows = models.map((model, i) => ({
    model,
    tokens: usageMap.get(model.id) ?? 0,
    colorVar: CHART_VARS[i % CHART_VARS.length],
  }));

  const totalUsed = rows.reduce((sum, r) => sum + r.tokens, 0);
  if (totalUsed === 0) {
    return (
      <div className="flex h-16 items-center justify-center text-sm text-muted-foreground">
        No calls yet on this pass
      </div>
    );
  }

  const max = Math.max(...rows.map((r) => r.tokens), 1);

  return (
    <div className="flex flex-col gap-2.5">
      {rows.map((r) => (
        <div key={r.model.id} className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium">{r.model.name}</span>
            <span className="tabular-nums text-muted-foreground">
              {formatCompact(r.tokens)} tokens
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full transition-[width]"
              style={{ width: `${(r.tokens / max) * 100}%`, backgroundColor: r.colorVar }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
