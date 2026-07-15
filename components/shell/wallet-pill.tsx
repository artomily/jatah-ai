"use client";

import Link from "next/link";
import { Wallet } from "lucide-react";
import { formatMoneyExact } from "@/lib/format";
import { useAppStore, useHydrated } from "@/lib/store/app-store";
import { Skeleton } from "@/components/ui/skeleton";

export function WalletPill() {
  const hydrated = useHydrated();
  const balance = useAppStore((s) => s.balance);

  if (!hydrated) {
    return <Skeleton className="h-8 w-24 rounded-lg" aria-hidden />;
  }

  return (
    <Link
      href="/wallet"
      className="flex h-8 items-center gap-1.5 rounded-lg border bg-card px-2.5 text-sm font-medium tabular-nums shadow-xs transition-colors outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
      aria-label={`Wallet balance ${formatMoneyExact(balance)}`}
    >
      <Wallet className="size-4 text-muted-foreground" aria-hidden />
      {formatMoneyExact(balance)}
    </Link>
  );
}
