"use client";

import Link from "next/link";
import { Zap } from "lucide-react";
import { CATEGORY_LABELS } from "@/lib/data/agents";
import { formatCompact, formatMoney, formatMoneyExact, PASS_LABELS } from "@/lib/format";
import { useEffectivePricing } from "@/lib/store/hooks";
import type { Agent, PassType } from "@/lib/types";
import { Rating } from "@/components/agents/rating-stars";
import { Badge } from "@/components/ui/badge";

function pricingLine(pricing: ReturnType<typeof useEffectivePricing>): string {
  if (pricing.perRequest) return `from ${formatMoney(pricing.perRequest.estMin)}/run`;
  const passEntries = Object.entries(pricing.passes) as Array<
    [PassType, { price: number }]
  >;
  if (passEntries.length > 0) {
    const cheapest = passEntries.sort((a, b) => a[1].price - b[1].price)[0];
    return `${PASS_LABELS[cheapest[0]]} · ${formatMoneyExact(cheapest[1].price)}`;
  }
  return "Pricing unavailable";
}

export function AgentCard({ agent }: { agent: Agent }) {
  const pricing = useEffectivePricing(agent);

  return (
    <Link
      href={`/agents/${agent.slug}`}
      className="group flex flex-col gap-3 rounded-xl border bg-card p-5 shadow-card transition-all outline-none hover:border-foreground/15 hover:shadow-pop focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold tracking-tight group-hover:text-brand">
            {agent.name}
          </h3>
          <p className="text-xs text-muted-foreground">
            {CATEGORY_LABELS[agent.category]}
          </p>
        </div>
        {agent.featured && (
          <Badge variant="secondary" className="bg-brand-soft text-brand dark:text-sidebar-accent-foreground">
            Featured
          </Badge>
        )}
      </div>

      <p className="line-clamp-2 min-h-10 text-sm leading-5 text-muted-foreground">
        {agent.tagline}
      </p>

      <div className="mt-auto flex items-center justify-between border-t pt-3 text-sm">
        <div className="flex items-center gap-3">
          <Rating rating={agent.rating} />
          <span className="flex items-center gap-1 text-xs text-muted-foreground tabular-nums">
            <Zap className="size-3" aria-hidden />
            {formatCompact(agent.runsCount)} runs
          </span>
        </div>
        <span className="font-medium tabular-nums">{pricingLine(pricing)}</span>
      </div>
    </Link>
  );
}
