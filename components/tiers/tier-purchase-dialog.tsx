"use client";

import { useState } from "react";
import { Check, Ticket } from "lucide-react";
import { PASS_LABELS, formatCompact, formatMoneyExact } from "@/lib/format";
import { usdToXlm } from "@/lib/stellar/config";
import { useAppStore, useHydrated } from "@/lib/store/app-store";
import { tierModels } from "@/lib/data/tiers";
import type { Tier } from "@/lib/data/tiers";
import type { PassType } from "@/lib/types";
import { QrisPay } from "@/components/wallet/qris-pay";
import { StellarDirectPay } from "@/components/wallet/stellar-direct-pay";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export function TierPurchaseDialog({
  tier,
  open,
  onOpenChange,
  defaultType,
}: {
  tier: Tier;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultType?: PassType;
}) {
  const hydrated = useHydrated();
  const balance = useAppStore((s) => s.balance);
  const purchaseTierPass = useAppStore((s) => s.purchaseTierPass);
  const purchaseTierPassWithStellar = useAppStore((s) => s.purchaseTierPassWithStellar);
  const purchaseTierPassWithQris = useAppStore((s) => s.purchaseTierPassWithQris);
  const setTopUpOpen = useAppStore((s) => s.setTopUpOpen);
  const passEntries = Object.entries(tier.passes) as Array<[PassType, { price: number }]>;
  const [selected, setSelected] = useState<PassType | null>(
    defaultType ?? passEntries[0]?.[0] ?? null,
  );
  const [justBought, setJustBought] = useState<PassType | null>(null);

  const selectedEntry = passEntries.find(([type]) => type === selected);
  const canAfford = hydrated && selectedEntry ? balance >= selectedEntry[1].price : false;
  const models = tierModels(tier);

  const handleClose = (next: boolean) => {
    onOpenChange(next);
    if (!next) setJustBought(null);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Get the {tier.name} tier pass</DialogTitle>
          <DialogDescription>
            Unlimited calls across {models.map((m) => m.name).join(" + ")} — sharing one{" "}
            {formatCompact(tier.tokenLimit)} token budget for the pass duration.
          </DialogDescription>
        </DialogHeader>

        {justBought ? (
          <>
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <span className="flex size-11 items-center justify-center rounded-full bg-success-soft text-success">
                <Check className="size-5" aria-hidden />
              </span>
              <div>
                <p className="font-medium">{PASS_LABELS[justBought]} activated</p>
                <p className="text-sm text-muted-foreground">
                  {models.map((m) => m.name).join(" and ")} are covered until the pass
                  expires.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => handleClose(false)}>Done</Button>
            </DialogFooter>
          </>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="grid gap-2" role="radiogroup" aria-label="Pass duration">
              {passEntries.map(([type, { price }]) => (
                <button
                  key={type}
                  type="button"
                  role="radio"
                  aria-checked={selected === type}
                  onClick={() => setSelected(type)}
                  className={cn(
                    "flex items-center justify-between gap-3 rounded-lg border px-3.5 py-3 text-left text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    selected === type ? "border-brand bg-brand-soft" : "hover:bg-muted/60",
                  )}
                >
                  <span className="flex items-center gap-2 font-medium">
                    <Ticket className="size-4 text-muted-foreground" aria-hidden />
                    {PASS_LABELS[type]}
                  </span>
                  <span className="tabular-nums font-semibold">{formatMoneyExact(price)}</span>
                </button>
              ))}
            </div>

            <Tabs defaultValue="balance">
              <TabsList className="w-full">
                <TabsTrigger value="balance">Balance</TabsTrigger>
                <TabsTrigger value="stellar">Stellar</TabsTrigger>
                <TabsTrigger value="qris">QRIS</TabsTrigger>
              </TabsList>

              <TabsContent value="balance" className="flex flex-col gap-3 pt-3">
                {!hydrated ? (
                  <Skeleton className="h-4 w-40" />
                ) : (
                  !canAfford &&
                  selectedEntry && (
                    <p className="text-xs text-warning">
                      Balance {formatMoneyExact(balance)} — top up{" "}
                      {formatMoneyExact(selectedEntry[1].price - balance)} more to buy this
                      pass.
                    </p>
                  )
                )}
                <DialogFooter className="mt-1 px-0">
                  {canAfford ? (
                    <Button
                      disabled={!selectedEntry}
                      onClick={() => {
                        if (!selectedEntry) return;
                        const res = purchaseTierPass(tier.slug, selectedEntry[0]);
                        if (res.ok) setJustBought(selectedEntry[0]);
                      }}
                    >
                      Buy {selectedEntry ? PASS_LABELS[selectedEntry[0]] : "pass"}
                    </Button>
                  ) : (
                    <Button
                      onClick={() => {
                        handleClose(false);
                        setTopUpOpen(true);
                      }}
                    >
                      Top up wallet
                    </Button>
                  )}
                </DialogFooter>
              </TabsContent>

              <TabsContent value="stellar" className="pt-3">
                {selectedEntry && (
                  <StellarDirectPay
                    amountUsd={selectedEntry[1].price}
                    amountXlm={usdToXlm(selectedEntry[1].price)}
                    onPaid={(hash) => {
                      const res = purchaseTierPassWithStellar(
                        tier.slug,
                        selectedEntry[0],
                        hash,
                        usdToXlm(selectedEntry[1].price),
                      );
                      if (res.ok) setJustBought(selectedEntry[0]);
                    }}
                    onCancel={() => handleClose(false)}
                  />
                )}
              </TabsContent>

              <TabsContent value="qris" className="pt-3">
                {selectedEntry && (
                  <QrisPay
                    amountUsd={selectedEntry[1].price}
                    order={{ purpose: "tier_pass", tierSlug: tier.slug, passType: selectedEntry[0] }}
                    onPaid={(orderId) => {
                      const res = purchaseTierPassWithQris(tier.slug, selectedEntry[0], orderId);
                      if (res.ok) setJustBought(selectedEntry[0]);
                    }}
                    onCancel={() => handleClose(false)}
                  />
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
