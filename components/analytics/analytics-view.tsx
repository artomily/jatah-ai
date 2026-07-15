"use client";

import { useState } from "react";
import { CATEGORY_LABELS } from "@/lib/data/agents";
import { formatMoney, formatPercent } from "@/lib/format";
import { useAppStore, useHydrated } from "@/lib/store/app-store";
import { useNow } from "@/hooks/use-now";
import {
  bucketSpendByDay,
  spendByCategory,
  spendByProvider,
  summarizeUsage,
} from "@/lib/store/selectors";
import { CategoryDonut } from "@/components/charts/category-donut";
import { ProviderBreakdownBars } from "@/components/charts/provider-breakdown-bars";
import { RunsBarChart } from "@/components/charts/runs-bar-chart";
import { SpendAreaChart } from "@/components/charts/spend-area-chart";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const CHART_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

export function AnalyticsView() {
  const hydrated = useHydrated();
  const transactions = useAppStore((s) => s.transactions);
  const now = useNow();
  const [range, setRange] = useState<"7" | "30">("30");

  if (!hydrated || now == null) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-8 w-40" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-72 rounded-xl" />
      </div>
    );
  }

  const days = Number(range);
  const since = now - days * 24 * 60 * 60 * 1000;
  const buckets = bucketSpendByDay(transactions, days, now);
  const categories = spendByCategory(transactions, since);
  const providers = spendByProvider(transactions, since);
  const summary = summarizeUsage(transactions, since);

  return (
    <div className="flex flex-col gap-6">
      <Tabs value={range} onValueChange={(v) => setRange(v as "7" | "30")}>
        <TabsList>
          <TabsTrigger value="7">7 days</TabsTrigger>
          <TabsTrigger value="30">30 days</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border bg-card p-4 shadow-card">
          <p className="text-sm text-muted-foreground">Total spend</p>
          <p className="text-2xl font-semibold tracking-tight tabular-nums">
            {formatMoney(summary.totalSpend)}
          </p>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-card">
          <p className="text-sm text-muted-foreground">Avg. cost per run</p>
          <p className="text-2xl font-semibold tracking-tight tabular-nums">
            {formatMoney(summary.avgCostPerRun)}
          </p>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-card">
          <p className="text-sm text-muted-foreground">Runs covered by pass</p>
          <p className="text-2xl font-semibold tracking-tight tabular-nums">
            {formatPercent(summary.passCoveredShare)}
          </p>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-card">
          <p className="text-sm text-muted-foreground">Cap-protected runs</p>
          <p className="text-2xl font-semibold tracking-tight tabular-nums">
            {summary.capProtectedCount}
          </p>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-5 shadow-card">
        <h2 className="mb-3 text-sm font-semibold tracking-tight">Spend over time</h2>
        <SpendAreaChart data={buckets} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border bg-card p-5 shadow-card">
          <h2 className="mb-3 text-sm font-semibold tracking-tight">Spend by category</h2>
          <CategoryDonut data={categories} />
          {categories.length > 0 && (
            <ul className="mt-4 flex flex-col gap-1.5">
              {categories.map((c, i) => (
                <li key={c.category} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span
                      className="size-2 rounded-full"
                      style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
                      aria-hidden
                    />
                    {CATEGORY_LABELS[c.category]}
                  </span>
                  <span className="tabular-nums text-muted-foreground">
                    {formatMoney(c.spend)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="rounded-xl border bg-card p-5 shadow-card">
          <h2 className="mb-3 text-sm font-semibold tracking-tight">Spend by provider</h2>
          <ProviderBreakdownBars data={providers} />
        </div>
      </div>

      <div className="rounded-xl border bg-card p-5 shadow-card">
        <h2 className="mb-3 text-sm font-semibold tracking-tight">Runs per day</h2>
        <RunsBarChart data={buckets} />
      </div>
    </div>
  );
}
