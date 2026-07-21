"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Ticket } from "lucide-react";
import { TIERS, HOURLY_TIERS, WEEKLY_TIERS, tierModels } from "@/lib/data/tiers";
import type { Tier } from "@/lib/data/tiers";
import { PASS_LABELS, formatCompact, formatMoneyExact } from "@/lib/format";
import { useAppStore, useHydrated } from "@/lib/store/app-store";
import { tierTokenUsageByModel } from "@/lib/store/selectors";
import { useNow } from "@/hooks/use-now";
import type { AiModel, OwnedPass, PassType, Transaction } from "@/lib/types";
import { PassCountdown } from "@/components/billing/pass-countdown";
import { TierTokenUsageBars } from "@/components/charts/tier-token-usage-bars";
import { TierPurchaseDialog } from "@/components/tiers/tier-purchase-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function TiersView({ initialBuySlug }: { initialBuySlug?: string }) {
  const hydrated = useHydrated();
  const passes = useAppStore((s) => s.passes);
  const transactions = useAppStore((s) => s.transactions);
  const now = useNow();
  const [buyTierSlug, setBuyTierSlug] = useState<string | null>(
    initialBuySlug && TIERS.some((t) => t.slug === initialBuySlug) ? initialBuySlug : null,
  );
  const [buyType, setBuyType] = useState<PassType>("pass_24h");

  const buyTier = TIERS.find((t) => t.slug === buyTierSlug) ?? null;

  const openBuy = (tier: Tier, type: PassType) => {
    setBuyTierSlug(tier.slug);
    setBuyType(type);
  };

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Tier passes</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          One price, several models, one shared token budget — for work you&apos;d rather
          not track model by model.
        </p>
      </div>

      <TierSection
        title="Hourly"
        description="A 24-hour window — for a deadline, a hackathon, a single big push."
        tiers={HOURLY_TIERS}
        type="pass_24h"
        gridClassName="sm:grid-cols-2 lg:grid-cols-3"
        hydrated={hydrated}
        now={now}
        passes={passes}
        transactions={transactions}
        onBuy={openBuy}
      />

      <TierSection
        title="Weekly"
        description="A full 7-day sprint — for a launch week or a project deadline."
        tiers={WEEKLY_TIERS}
        type="pass_7d"
        gridClassName="sm:grid-cols-2 lg:grid-cols-4"
        hydrated={hydrated}
        now={now}
        passes={passes}
        transactions={transactions}
        onBuy={openBuy}
      />

      <p className="text-xs text-muted-foreground">
        Go over a tier&apos;s token allowance and calls just fall back to that model&apos;s
        normal per-request billing — never blocked, never a surprise.
      </p>

      {buyTier && (
        <TierPurchaseDialog
          tier={buyTier}
          defaultType={buyType}
          open={buyTier != null}
          onOpenChange={(open) => {
            if (!open) setBuyTierSlug(null);
          }}
        />
      )}
    </div>
  );
}

function TierSection({
  title,
  description,
  tiers,
  type,
  gridClassName,
  hydrated,
  now,
  passes,
  transactions,
  onBuy,
}: {
  title: string;
  description: string;
  tiers: Tier[];
  type: PassType;
  gridClassName: string;
  hydrated: boolean;
  now: number | null;
  passes: OwnedPass[];
  transactions: Transaction[];
  onBuy: (tier: Tier, type: PassType) => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
        <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
      </div>

      <div className={`grid grid-cols-1 gap-5 ${gridClassName}`}>
        {tiers.map((tier) => {
          const models = tierModels(tier);
          const activePass =
            hydrated && now != null
              ? passes.find(
                  (p) =>
                    p.tierId === tier.id &&
                    p.type === type &&
                    p.activatedAt <= now &&
                    p.expiresAt > now,
                )
              : undefined;
          const price = tier.passes[type]?.price;

          return (
            <div
              key={`${tier.id}-${type}`}
              className="flex flex-col gap-4 rounded-xl border bg-card p-6 shadow-card"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-lg font-semibold tracking-tight">{tier.name}</p>
                  {activePass && (
                    <span className="flex items-center gap-1 text-xs font-medium text-success">
                      <Ticket className="size-3.5" aria-hidden />
                      Active
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{tier.blurb}</p>
              </div>

              <div className="border-t pt-4">
                <p className="text-3xl font-semibold tracking-tight tabular-nums">
                  {price != null ? formatMoneyExact(price) : "—"}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {formatCompact(tier.tokenLimit)} tokens shared across every model below.
                </p>
              </div>

              <ul className="flex flex-col gap-1.5 border-t pt-4">
                {models.map((model) => (
                  <li key={model.id} className="flex items-center gap-2 text-sm">
                    <Check className="size-3.5 shrink-0 text-success" aria-hidden />
                    <Link href={`/models/${model.slug}`} className="hover:underline">
                      {model.name}
                    </Link>
                  </li>
                ))}
              </ul>

              {!hydrated || now == null ? (
                <Skeleton className="h-10 w-full" />
              ) : activePass ? (
                <ActiveTierPanel
                  models={models}
                  pass={activePass}
                  transactions={transactions}
                  onExtend={() => onBuy(tier, type)}
                />
              ) : (
                <Button className="mt-auto" onClick={() => onBuy(tier, type)}>
                  Get the {tier.name} pass
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ActiveTierPanel({
  models,
  pass,
  transactions,
  onExtend,
}: {
  models: AiModel[];
  pass: OwnedPass;
  transactions: Transaction[];
  onExtend: () => void;
}) {
  const tokenLimit = pass.tokenLimit ?? 0;
  const tokensUsed = pass.tokensUsed ?? 0;
  const remaining = Math.max(tokenLimit - tokensUsed, 0);
  const usedPct = tokenLimit > 0 ? Math.min((tokensUsed / tokenLimit) * 100, 100) : 0;
  const usage = tierTokenUsageByModel(transactions, pass.id);

  return (
    <div className="mt-auto flex flex-col gap-4 border-t pt-4">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{PASS_LABELS[pass.type]}</span>
        <span className="font-medium text-success">
          <PassCountdown expiresAt={pass.expiresAt} /> left
        </span>
      </div>

      <div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{formatCompact(tokensUsed)} used</span>
          <span>
            {formatCompact(remaining)} left of {formatCompact(tokenLimit)}
          </span>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className={cn("h-full rounded-full", usedPct >= 100 ? "bg-warning" : "bg-brand")}
            style={{ width: `${usedPct}%` }}
          />
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-xs font-medium text-muted-foreground">
          Token usage by model
        </p>
        <TierTokenUsageBars models={models} usage={usage} />
      </div>

      <Button variant="outline" size="sm" onClick={onExtend}>
        Extend pass
      </Button>
    </div>
  );
}
