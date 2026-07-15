"use client";

import { Plus } from "lucide-react";
import { formatMoneyExact } from "@/lib/format";
import { useAppStore, useHydrated } from "@/lib/store/app-store";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function BalanceCard() {
  const hydrated = useHydrated();
  const balance = useAppStore((s) => s.balance);
  const setTopUpOpen = useAppStore((s) => s.setTopUpOpen);

  return (
    <div className="flex flex-col gap-4 rounded-xl border bg-card p-6 shadow-card">
      <p className="text-sm text-muted-foreground">Wallet balance</p>
      {hydrated ? (
        <p className="text-4xl font-semibold tracking-tight tabular-nums">
          {formatMoneyExact(balance)}
        </p>
      ) : (
        <Skeleton className="h-10 w-40" />
      )}
      <Button className="self-start" onClick={() => setTopUpOpen(true)}>
        <Plus aria-hidden />
        Top up
      </Button>
    </div>
  );
}
