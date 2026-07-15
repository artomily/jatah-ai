"use client";

import { CircleDollarSign, TrendingUp, Ticket, Zap } from "lucide-react";
import { formatCompact, formatMoney } from "@/lib/format";
import { CREATOR_PERSONA_ID, getCreatorStats } from "@/lib/data/creator";
import { getAgentsByCreator } from "@/lib/data/agents";
import { getCreator } from "@/lib/data/creators";
import { useNow } from "@/hooks/use-now";
import { AgentPricingRow } from "@/components/creator/agent-pricing-row";
import { RevenueSplitBars } from "@/components/creator/revenue-split-bars";
import { EarningsAreaChart } from "@/components/charts/earnings-area-chart";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

const persona = getCreator(CREATOR_PERSONA_ID);
const agents = getAgentsByCreator(CREATOR_PERSONA_ID);

export function CreatorView() {
  const now = useNow();

  if (now == null || !persona) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-16 w-full rounded-xl" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-72 rounded-xl" />
      </div>
    );
  }

  const stats = getCreatorStats(now);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3 rounded-xl border bg-brand-soft px-4 py-3">
        <Avatar>
          <AvatarFallback className="bg-card text-sm font-medium text-brand dark:text-sidebar-accent-foreground">
            {persona.initials}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-medium">
            Viewing as {persona.name} —{" "}
            <span className="text-muted-foreground">demo persona</span>
          </p>
          <p className="text-xs text-muted-foreground">{persona.handle}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border bg-card p-4 shadow-card">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Lifetime earnings</p>
            <CircleDollarSign className="size-4 text-muted-foreground" aria-hidden />
          </div>
          <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">
            {formatMoney(stats.lifetime)}
          </p>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-card">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">This month</p>
            <TrendingUp className="size-4 text-muted-foreground" aria-hidden />
          </div>
          <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">
            {formatMoney(stats.thisMonth)}
          </p>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-card">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Runs served (30d)</p>
            <Zap className="size-4 text-muted-foreground" aria-hidden />
          </div>
          <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">
            {formatCompact(stats.runsServed)}
          </p>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-card">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Active pass holders</p>
            <Ticket className="size-4 text-muted-foreground" aria-hidden />
          </div>
          <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">
            {formatCompact(stats.activePassHolders)}
          </p>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-5 shadow-card">
        <h2 className="mb-3 text-sm font-semibold tracking-tight">Earnings, last 90 days</h2>
        <EarningsAreaChart data={stats.series90d} />
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold tracking-tight">Your agents</h2>
        <p className="mb-3 text-xs text-muted-foreground">
          Toggle which billing models each agent offers — changes apply immediately on its
          public page.
        </p>
        <div className="flex flex-col gap-3">
          {agents.map((agent) => (
            <AgentPricingRow key={agent.id} agent={agent} />
          ))}
        </div>
      </div>

      <div className="rounded-xl border bg-card p-5 shadow-card">
        <h2 className="mb-4 text-sm font-semibold tracking-tight">
          Usage vs. pass revenue (90d)
        </h2>
        <RevenueSplitBars perAgent={stats.perAgent} />
      </div>

      <p className="text-xs text-muted-foreground">
        Payouts settle via x402 — simulated in this demo, no real funds move.
      </p>
    </div>
  );
}
