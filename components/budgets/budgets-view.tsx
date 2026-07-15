"use client";

import { useState } from "react";
import { BUDGET_WINDOW_LABELS, budgetWindowStart, formatMoney, formatMoneyExact } from "@/lib/format";
import { useAppStore, useHydrated } from "@/lib/store/app-store";
import { useNow } from "@/hooks/use-now";
import { spentSince } from "@/lib/store/selectors";
import type { BudgetWindow } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

const WINDOWS: Array<{ window: BudgetWindow; max: number; step: number; hint: string }> = [
  { window: "daily", max: 20, step: 0.5, hint: "Resets every day at midnight" },
  { window: "weekly", max: 80, step: 2, hint: "Resets every Monday" },
  { window: "monthly", max: 300, step: 5, hint: "Resets on the 1st of the month" },
];

function BudgetCard({
  window,
  max,
  step,
  hint,
  cap,
  spent,
  onSave,
}: {
  window: BudgetWindow;
  max: number;
  step: number;
  hint: string;
  cap: number | null;
  spent: number;
  onSave: (cap: number | null) => void;
}) {
  const fallback = Math.round(max * 0.15);
  const [draft, setDraft] = useState(cap ?? fallback);
  // Reset the draft when `cap` changes underneath us (e.g. after a save).
  // Adjusting state during render — not in an effect — is the pattern React
  // recommends for this: https://react.dev/learn/you-might-not-need-an-effect
  const [prevCap, setPrevCap] = useState(cap);
  if (cap !== prevCap) {
    setPrevCap(cap);
    setDraft(cap ?? fallback);
  }

  const pct = cap ? Math.min((spent / cap) * 100, 100) : 0;
  const over = cap != null && spent > cap;
  const dirty = cap !== draft;

  return (
    <div className="flex flex-col gap-4 rounded-xl border bg-card p-5 shadow-card">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold tracking-tight">{BUDGET_WINDOW_LABELS[window]}</h2>
          <p className="text-xs text-muted-foreground">{hint}</p>
        </div>
        {cap != null && (
          <span className="text-xs text-muted-foreground tabular-nums">
            {formatMoney(spent)} / {formatMoneyExact(cap)}
          </span>
        )}
      </div>

      {cap != null && (
        <div className="flex flex-col gap-1.5">
          <Progress value={pct} className={cn(over && "[&>div]:bg-warning")} />
          <p className={cn("text-xs", over ? "text-warning" : "text-muted-foreground")}>
            {over
              ? `Over budget by ${formatMoney(spent - cap)}`
              : `${formatMoney(Math.max(cap - spent, 0))} remaining`}
          </p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor={`${window}-cap`}>Cap</Label>
        <div className="flex items-center gap-3">
          <Slider
            id={`${window}-cap`}
            min={0}
            max={max}
            step={step}
            value={[draft]}
            onValueChange={([v]) => setDraft(v)}
            className="flex-1"
          />
          <Input
            type="number"
            min={0}
            max={max}
            step={step}
            value={draft}
            onChange={(e) => setDraft(Number(e.target.value))}
            className="w-24 tabular-nums"
            aria-label={`${BUDGET_WINDOW_LABELS[window]} budget amount`}
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button size="sm" disabled={!dirty} onClick={() => onSave(draft)}>
          Save
        </Button>
        {cap != null && (
          <Button size="sm" variant="outline" onClick={() => onSave(null)}>
            Remove cap
          </Button>
        )}
      </div>
    </div>
  );
}

export function BudgetsView() {
  const hydrated = useHydrated();
  const budgets = useAppStore((s) => s.budgets);
  const transactions = useAppStore((s) => s.transactions);
  const setBudget = useAppStore((s) => s.setBudget);
  const now = useNow();

  if (!hydrated || now == null) {
    return (
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-64 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="max-w-2xl text-sm text-muted-foreground">
        If a run could push you over a remaining budget, we ask you to confirm before it
        charges — budgets never block a run silently, and they never charge without your
        approval.
      </p>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {WINDOWS.map((w) => (
          <BudgetCard
            key={w.window}
            window={w.window}
            max={w.max}
            step={w.step}
            hint={w.hint}
            cap={budgets[w.window]}
            spent={spentSince(transactions, budgetWindowStart(w.window, now))}
            onSave={(cap) => setBudget(w.window, cap)}
          />
        ))}
      </div>
    </div>
  );
}
