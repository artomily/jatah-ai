import { formatMoney } from "@/lib/format";
import { getAgentById } from "@/lib/data/agents";
import type { AgentEarnings } from "@/lib/data/creator";

export function RevenueSplitBars({ perAgent }: { perAgent: AgentEarnings[] }) {
  return (
    <div className="flex flex-col gap-4">
      {perAgent.map((entry) => {
        const agent = getAgentById(entry.agentId);
        const total = entry.usage + entry.passes;
        const usagePct = total > 0 ? (entry.usage / total) * 100 : 0;
        return (
          <div key={entry.agentId} className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{agent?.name ?? entry.agentId}</span>
              <span className="text-xs text-muted-foreground tabular-nums">
                {formatMoney(entry.usage)} usage · {formatMoney(entry.passes)} passes
              </span>
            </div>
            <div className="flex h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-[var(--chart-1)]"
                style={{ width: `${usagePct}%` }}
                aria-hidden
              />
              <div
                className="h-full bg-[var(--chart-2)]"
                style={{ width: `${100 - usagePct}%` }}
                aria-hidden
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
