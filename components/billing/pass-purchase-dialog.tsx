"use client";

import { useState } from "react";
import { Check, Ticket } from "lucide-react";
import {
  PASS_LABELS,
  formatMoney,
  formatMoneyExact,
} from "@/lib/format";
import { usdToXlm } from "@/lib/stellar/config";
import { useAppStore, useHydrated } from "@/lib/store/app-store";
import type { Agent, PassType } from "@/lib/types";
import { useEffectivePricing } from "@/lib/store/hooks";
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

export function PassPurchaseDialog({
  agent,
  open,
  onOpenChange,
  defaultType,
}: {
  agent: Agent;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultType?: PassType;
}) {
  const hydrated = useHydrated();
  const balance = useAppStore((s) => s.balance);
  const purchasePass = useAppStore((s) => s.purchasePass);
  const purchasePassWithStellar = useAppStore((s) => s.purchasePassWithStellar);
  const setTopUpOpen = useAppStore((s) => s.setTopUpOpen);
  const pricing = useEffectivePricing(agent);
  const passEntries = Object.entries(pricing.passes) as Array<
    [PassType, { price: number }]
  >;
  const [selected, setSelected] = useState<PassType | null>(
    defaultType ?? passEntries[0]?.[0] ?? null,
  );
  const [justBought, setJustBought] = useState<PassType | null>(null);

  const selectedEntry = passEntries.find(([type]) => type === selected);
  const estMax = agent.pricing.perRequest?.estMax;
  const breakEven =
    selectedEntry && estMax ? Math.ceil(selectedEntry[1].price / estMax) : undefined;
  const canAfford = hydrated && selectedEntry ? balance >= selectedEntry[1].price : false;

  const handleClose = (next: boolean) => {
    onOpenChange(next);
    if (!next) setJustBought(null);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Buy a time pass for {agent.name}</DialogTitle>
          <DialogDescription>
            Unlimited runs for the pass duration — no per-request charges while it&apos;s active.
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
                  Runs on {agent.name} are covered until the pass expires.
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
                    selected === type
                      ? "border-brand bg-brand-soft"
                      : "hover:bg-muted/60",
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

            {breakEven != null && (
              <p className="text-xs text-muted-foreground">
                Breaks even after ~{breakEven} run{breakEven === 1 ? "" : "s"} at typical usage
                pricing.
              </p>
            )}

            <Tabs defaultValue="balance">
              <TabsList className="w-full">
                <TabsTrigger value="balance">Pay from balance</TabsTrigger>
                <TabsTrigger value="stellar">Stellar wallet</TabsTrigger>
              </TabsList>

              <TabsContent value="balance" className="flex flex-col gap-3 pt-3">
                {!hydrated ? (
                  <Skeleton className="h-4 w-40" />
                ) : (
                  !canAfford &&
                  selectedEntry && (
                    <p className="text-xs text-warning">
                      Balance {formatMoney(balance)} — top up{" "}
                      {formatMoney(selectedEntry[1].price - balance)} more to buy this pass.
                    </p>
                  )
                )}
                <DialogFooter className="mt-1 px-0">
                  {canAfford ? (
                    <Button
                      disabled={!selectedEntry}
                      onClick={() => {
                        if (!selectedEntry) return;
                        const res = purchasePass(agent.id, selectedEntry[0]);
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
                      const res = purchasePassWithStellar(
                        agent.id,
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
            </Tabs>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
