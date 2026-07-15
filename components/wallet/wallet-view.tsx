"use client";

import Link from "next/link";
import { useAppStore, useHydrated } from "@/lib/store/app-store";
import { useNow } from "@/hooks/use-now";
import { bucketSpendByDay } from "@/lib/store/selectors";
import { BalanceCard } from "@/components/wallet/balance-card";
import { StellarWalletCard } from "@/components/wallet/stellar-wallet-card";
import { PassesSection } from "@/components/wallet/passes-section";
import { TransactionRow } from "@/components/wallet/transaction-row";
import { SpendAreaChart } from "@/components/charts/spend-area-chart";
import { Skeleton } from "@/components/ui/skeleton";

export function WalletView() {
  const hydrated = useHydrated();
  const transactions = useAppStore((s) => s.transactions);
  const now = useNow();

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <BalanceCard />
        <StellarWalletCard />
        <div className="flex flex-col gap-2 rounded-xl border bg-card p-5 shadow-card lg:col-span-2">
          <p className="text-sm font-medium text-muted-foreground">Spend, last 7 days</p>
          {!hydrated || now == null ? (
            <Skeleton className="h-16 w-full" />
          ) : (
            <SpendAreaChart data={bucketSpendByDay(transactions, 7, now)} compact />
          )}
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold tracking-tight">Time passes</h2>
        <PassesSection />
      </div>

      <div className="flex flex-col gap-2 rounded-xl border bg-card p-5 shadow-card">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold tracking-tight">Recent transactions</h2>
          <Link href="/transactions" className="text-xs text-muted-foreground hover:underline">
            View all
          </Link>
        </div>
        {!hydrated ? (
          <Skeleton className="h-40 w-full" />
        ) : transactions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No activity yet.</p>
        ) : (
          <div className="flex flex-col divide-y">
            {transactions.slice(0, 10).map((txn) => (
              <TransactionRow key={txn.id} txn={txn} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
