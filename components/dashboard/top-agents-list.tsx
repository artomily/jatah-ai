import Link from "next/link";
import { formatMoney } from "@/lib/format";
import { getAgentById } from "@/lib/data/agents";
import type { AgentSpend } from "@/lib/store/selectors";

export function TopAgentsList({ agents }: { agents: AgentSpend[] }) {
  if (agents.length === 0) {
    return <p className="text-sm text-muted-foreground">No runs yet this period.</p>;
  }

  return (
    <ul className="flex flex-col gap-1">
      {agents.map((entry) => {
        const agent = getAgentById(entry.agentId);
        return (
          <li key={entry.agentId}>
            <Link
              href={agent ? `/agents/${agent.slug}` : "/marketplace"}
              className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 text-sm transition-colors outline-none hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="min-w-0 truncate font-medium">{entry.agentName}</span>
              <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                {entry.runs} run{entry.runs === 1 ? "" : "s"}
              </span>
              <span className="w-16 shrink-0 text-right font-medium tabular-nums">
                {formatMoney(entry.spend)}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
