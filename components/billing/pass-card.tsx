import Link from "next/link";
import { Ticket } from "lucide-react";
import { PASS_LABELS, formatMoneyExact } from "@/lib/format";
import { getAgentById } from "@/lib/data/agents";
import type { OwnedPass } from "@/lib/types";
import { PassCountdown } from "@/components/billing/pass-countdown";
import { cn } from "@/lib/utils";

export function PassCard({ pass, expired = false }: { pass: OwnedPass; expired?: boolean }) {
  const agent = getAgentById(pass.agentId);

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border bg-card p-4 shadow-card",
        expired && "opacity-60",
      )}
    >
      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-lg",
          expired ? "bg-muted text-muted-foreground" : "bg-brand-soft text-brand",
        )}
        aria-hidden
      >
        <Ticket className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">
          {agent ? (
            <Link href={`/agents/${agent.slug}`} className="hover:underline">
              {agent.name}
            </Link>
          ) : (
            "Unknown agent"
          )}
        </p>
        <p className="text-xs text-muted-foreground">
          {PASS_LABELS[pass.type]} · {formatMoneyExact(pass.price)}
        </p>
      </div>
      <div className="text-right text-xs">
        {expired ? (
          <span className="text-muted-foreground">Expired</span>
        ) : (
          <span className="font-medium text-success">
            <PassCountdown expiresAt={pass.expiresAt} /> left
          </span>
        )}
      </div>
    </div>
  );
}
