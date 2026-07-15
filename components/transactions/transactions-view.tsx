"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { formatDayLabel } from "@/lib/format";
import { useAppStore, useHydrated } from "@/lib/store/app-store";
import type { Transaction, TransactionType } from "@/lib/types";
import { TransactionRow } from "@/components/wallet/transaction-row";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Filter = "all" | TransactionType;

const FILTERS: Array<{ value: Filter; label: string }> = [
  { value: "all", label: "All" },
  { value: "usage", label: "Agent usage" },
  { value: "model_usage", label: "Model calls" },
  { value: "pass_purchase", label: "Passes" },
  { value: "top_up", label: "Top-ups" },
];

function groupByDay(transactions: Transaction[]) {
  const groups: Array<{ label: string; items: Transaction[] }> = [];
  for (const txn of transactions) {
    const label = formatDayLabel(txn.createdAt);
    const last = groups[groups.length - 1];
    if (last && last.label === label) {
      last.items.push(txn);
    } else {
      groups.push({ label, items: [txn] });
    }
  }
  return groups;
}

export function TransactionsView() {
  const hydrated = useHydrated();
  const transactions = useAppStore((s) => s.transactions);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return transactions.filter((t) => {
      if (filter !== "all" && t.type !== filter) return false;
      if (!q) return true;
      return [t.agentName, t.modelName, t.taskPrompt, t.id].some((f) =>
        f?.toLowerCase().includes(q),
      );
    });
  }, [transactions, filter, query]);

  const groups = useMemo(() => groupByDay(filtered), [filtered]);

  if (!hydrated) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-full sm:w-96" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
          <TabsList className="w-full justify-start overflow-x-auto sm:w-fit">
            {FILTERS.map((f) => (
              <TabsTrigger key={f.value} value={f.value}>
                {f.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="relative sm:ml-auto sm:w-64">
          <Search
            className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by agent, model, or task…"
            aria-label="Search transactions"
            className="pl-8"
          />
        </div>
      </div>

      {groups.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed py-16 text-center">
          <p className="font-medium">No transactions match</p>
          <p className="text-sm text-muted-foreground">Try a different filter or search.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {groups.map((group) => (
            <div key={group.label}>
              <p className="mb-1 px-1 text-xs font-medium text-muted-foreground">
                {group.label}
              </p>
              <div className="flex flex-col divide-y rounded-xl border bg-card px-3 shadow-card">
                {group.items.map((txn) => (
                  <TransactionRow key={txn.id} txn={txn} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
