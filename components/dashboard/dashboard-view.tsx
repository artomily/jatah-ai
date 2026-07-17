"use client";

import Link from "next/link";
import { CircleDollarSign, Gauge, Ticket, Zap } from "lucide-react";
import {
  budgetWindowStart,
  formatMoney,
  startOfToday,
} from "@/lib/format";
import { useAppStore, useHydrated } from "@/lib/store/app-store";
import { useNow } from "@/hooks/use-now";
import {
  bucketSpendByDay,
  getActivePasses,
  runsSince,
  spentSince,
  topAgentsBySpend,
} from "@/lib/store/selectors";
import { StatCard } from "@/components/dashboard/stat-card";
import { BudgetProgress } from "@/components/dashboard/budget-progress";
import { TopAgentsList } from "@/components/dashboard/top-agents-list";
import { PassCard } from "@/components/billing/pass-card";
import { PricingList } from "@/components/dashboard/pricing-list";
import { SpendAreaChart } from "@/components/charts/spend-area-chart";
import { TransactionRow } from "@/components/wallet/transaction-row";
import { Skeleton } from "@/components/ui/skeleton";

export function DashboardView() {
  const hydrated = useHydrated();
  const transactions = useAppStore((s) => s.transactions);
  const passes = useAppStore((s) => s.passes);
  const budgets = useAppStore((s) => s.budgets);
  const now = useNow();

  if (!hydrated || now == null) {
    return (
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  const todayStart = startOfToday(now);
  const spentToday = spentSince(transactions, todayStart);
  const runsToday = runsSince(transactions, todayStart);
  const activePasses = getActivePasses(passes, now);

  const windows: Array<{ window: "daily" | "weekly" | "monthly"; label: string }> = [
    { window: "daily", label: "Daily" },
    { window: "weekly", label: "Weekly" },
    { window: "monthly", label: "Monthly" },
  ];
  const tightest = windows
    .map((w) => {
      const cap = budgets[w.window];
      if (cap == null) return null;
      const spent = spentSince(transactions, budgetWindowStart(w.window, now));
      return { ...w, cap, remaining: cap - spent };
    })
    .filter((w): w is NonNullable<typeof w> => w !== null)
    .sort((a, b) => a.remaining - b.remaining)[0];

  const spendBuckets = bucketSpendByDay(transactions, 7, now);
  const topAgents = topAgentsBySpend(transactions, budgetWindowStart("monthly", now));
  const recent = transactions.slice(0, 5);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Spent today" value={formatMoney(spentToday)} icon={CircleDollarSign} />
        <StatCard label="Runs today" value={String(runsToday)} icon={Zap} />
        <StatCard
          label={tightest ? `${tightest.label} budget remaining` : "Budget remaining"}
          value={tightest ? formatMoney(Math.max(tightest.remaining, 0)) : "No cap set"}
          icon={Gauge}
        />
        <StatCard label="Active passes" value={String(activePasses.length)} icon={Ticket} />
      </div>

      {tightest && tightest.remaining < 0 && (
        <div className="rounded-xl border border-warning/30 bg-warning-soft px-4 py-3 text-sm text-warning">
          You&apos;re over your {tightest.label.toLowerCase()} budget by{" "}
          {formatMoney(Math.abs(tightest.remaining))}.{" "}
          <Link href="/budgets" className="underline underline-offset-2">
            Review budgets
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {windows.map((w) => (
          <BudgetProgress
            key={w.window}
            label={w.label}
            cap={budgets[w.window]}
            spent={spentSince(transactions, budgetWindowStart(w.window, now))}
            linkToBudgets
          />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-3 rounded-xl border bg-card p-5 shadow-card lg:col-span-2">
          <h2 className="text-sm font-semibold tracking-tight">Spend, last 7 days</h2>
          <SpendAreaChart data={spendBuckets} />
        </div>
        <div className="flex flex-col gap-3 rounded-xl border bg-card p-5 shadow-card">
          <h2 className="text-sm font-semibold tracking-tight">Most used agents</h2>
          <TopAgentsList agents={topAgents} />
        </div>
      </div>

      {activePasses.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold tracking-tight">Active passes</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {activePasses.map((pass) => (
              <PassCard key={pass.id} pass={pass} />
            ))}
          </div>
        </div>
      )}

      <PricingList />

      <div className="flex flex-col gap-2 rounded-xl border bg-card p-5 shadow-card">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold tracking-tight">Recent receipts</h2>
          <Link href="/transactions" className="text-xs text-muted-foreground hover:underline">
            View all
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="text-sm text-muted-foreground">No activity yet.</p>
        ) : (
          <div className="flex flex-col divide-y">
            {recent.map((txn) => (
              <TransactionRow key={txn.id} txn={txn} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
