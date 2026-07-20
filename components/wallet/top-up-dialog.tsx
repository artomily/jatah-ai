"use client";

import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { formatMoneyExact } from "@/lib/format";
import {
  XLM_TOP_UP_PRESETS,
  formatXlm,
  stellarExplorerTxUrl,
  truncateStellarAddress,
  xlmToStroops,
  xlmToUsd,
} from "@/lib/stellar/config";
import { StellarAccountNotFoundError, fundTestnetAccount } from "@/lib/stellar/payments";
import { topUpViaContract } from "@/lib/stellar/soroban";
import { useStellarWallet } from "@/hooks/use-stellar-wallet";
import { useAppStore } from "@/lib/store/app-store";
import { QrisPay } from "@/components/wallet/qris-pay";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const PRESETS = [5, 10, 25];

/** Mounted once at the app root — opened globally via `setTopUpOpen`. */
export function TopUpDialog() {
  const open = useAppStore((s) => s.topUpOpen);
  const setOpen = useAppStore((s) => s.setTopUpOpen);
  const topUp = useAppStore((s) => s.topUp);
  const topUpWithStellar = useAppStore((s) => s.topUpWithStellar);
  const topUpWithQris = useAppStore((s) => s.topUpWithQris);
  const [selected, setSelected] = useState<number | "custom">(10);
  const [custom, setCustom] = useState("");

  const amount = selected === "custom" ? Number(custom) : selected;
  const valid = Number.isFinite(amount) && amount > 0 && amount <= 500;

  const handleClose = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setSelected(10);
      setCustom("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Top up wallet</DialogTitle>
          <DialogDescription>Add funds to cover usage runs and passes.</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="demo">
          <TabsList className="w-full">
            <TabsTrigger value="demo">Demo funds</TabsTrigger>
            <TabsTrigger value="stellar">Stellar</TabsTrigger>
            <TabsTrigger value="qris">QRIS</TabsTrigger>
          </TabsList>

          <TabsContent value="demo" className="flex flex-col gap-3 pt-3">
            <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Top-up amount">
              {PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  role="radio"
                  aria-checked={selected === preset}
                  onClick={() => setSelected(preset)}
                  className={cn(
                    "flex h-11 items-center justify-center rounded-lg border text-sm font-medium tabular-nums transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    selected === preset ? "border-brand bg-brand-soft" : "hover:bg-muted/60",
                  )}
                >
                  {formatMoneyExact(preset)}
                </button>
              ))}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="custom-amount">Custom amount</Label>
              <Input
                id="custom-amount"
                type="number"
                inputMode="decimal"
                min={1}
                max={500}
                step="0.01"
                placeholder="$0.00"
                value={custom}
                onChange={(e) => {
                  setCustom(e.target.value);
                  setSelected("custom");
                }}
                autoComplete="off"
              />
            </div>

            <DialogFooter className="mt-1 px-0">
              <Button variant="outline" onClick={() => handleClose(false)}>
                Cancel
              </Button>
              <Button
                disabled={!valid}
                onClick={() => {
                  topUp(amount);
                  handleClose(false);
                }}
              >
                Add {valid ? formatMoneyExact(amount) : "funds"}
              </Button>
            </DialogFooter>
          </TabsContent>

          <TabsContent value="stellar" className="pt-3">
            <StellarTopUp
              onDone={(amountUsd, amountXlm, hash) => {
                topUpWithStellar(amountUsd, amountXlm, hash);
                handleClose(false);
              }}
              onCancel={() => handleClose(false)}
            />
          </TabsContent>

          <TabsContent value="qris" className="flex flex-col gap-3 pt-3">
            <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Top-up amount">
              {PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  role="radio"
                  aria-checked={selected === preset}
                  onClick={() => setSelected(preset)}
                  className={cn(
                    "flex h-11 items-center justify-center rounded-lg border text-sm font-medium tabular-nums transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    selected === preset ? "border-brand bg-brand-soft" : "hover:bg-muted/60",
                  )}
                >
                  {formatMoneyExact(preset)}
                </button>
              ))}
            </div>
            {valid && (
              <QrisPay
                amountUsd={amount}
                order={{ purpose: "top_up", amountUsd: amount }}
                onPaid={(orderId) => {
                  topUpWithQris(amount, orderId);
                  handleClose(false);
                }}
                onCancel={() => handleClose(false)}
              />
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function StellarTopUp({
  onDone,
  onCancel,
}: {
  onDone: (amountUsd: number, amountXlm: number, hash: string) => void;
  onCancel: () => void;
}) {
  const { address, ready, connecting, connect } = useStellarWallet();
  const [selectedXlm, setSelectedXlm] = useState<number>(XLM_TOP_UP_PRESETS[0]);
  const [paying, setPaying] = useState(false);
  const [notFunded, setNotFunded] = useState(false);
  const [funding, setFunding] = useState(false);

  const pay = async () => {
    if (!address) return;
    setPaying(true);
    setNotFunded(false);
    try {
      const hash = await topUpViaContract(address, xlmToStroops(selectedXlm));
      toast.success(
        <span className="flex items-center gap-1">
          Payment confirmed
          <a
            href={stellarExplorerTxUrl(hash)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-0.5 underline"
          >
            view <ExternalLink className="size-3" />
          </a>
        </span>,
      );
      onDone(xlmToUsd(selectedXlm), selectedXlm, hash);
    } catch (err) {
      if (err instanceof StellarAccountNotFoundError) {
        setNotFunded(true);
      } else {
        toast.error(err instanceof Error ? err.message : "Payment failed");
      }
    } finally {
      setPaying(false);
    }
  };

  const handleFund = async () => {
    if (!address) return;
    setFunding(true);
    try {
      await fundTestnetAccount(address);
      toast.success("Funded 10,000 testnet XLM");
      setNotFunded(false);
    } catch {
      toast.error("Friendbot funding failed. Try again in a moment.");
    } finally {
      setFunding(false);
    }
  };

  if (!ready) return null;

  if (!address) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">
          Connect a Stellar wallet to pay with testnet XLM through our Soroban top-up contract.
          Funds are credited to your wallet balance at a demo rate ({formatMoneyExact(xlmToUsd(1))}
          /XLM).
        </p>
        <DialogFooter className="mt-1 px-0">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={connect} disabled={connecting}>
            {connecting ? "Connecting…" : "Connect wallet"}
          </Button>
        </DialogFooter>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-muted-foreground">
        Paying from <span className="font-mono">{truncateStellarAddress(address)}</span>
      </p>

      <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="XLM amount">
        {XLM_TOP_UP_PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            role="radio"
            aria-checked={selectedXlm === preset}
            onClick={() => setSelectedXlm(preset)}
            className={cn(
              "flex h-11 flex-col items-center justify-center rounded-lg border text-sm font-medium tabular-nums transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
              selectedXlm === preset ? "border-brand bg-brand-soft" : "hover:bg-muted/60",
            )}
          >
            {preset} XLM
          </button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Credits {formatMoneyExact(xlmToUsd(selectedXlm))} to your wallet balance.
      </p>

      {notFunded && (
        <div className="flex flex-col gap-2 rounded-lg border bg-muted/40 p-3">
          <p className="text-xs text-muted-foreground">
            This wallet has no testnet XLM yet.
          </p>
          <Button size="sm" variant="outline" onClick={handleFund} disabled={funding}>
            {funding ? "Funding…" : "Fund via Friendbot"}
          </Button>
        </div>
      )}

      <DialogFooter className="mt-1 px-0">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={pay} disabled={paying}>
          {paying ? "Confirming…" : `Pay ${formatXlm(selectedXlm)}`}
        </Button>
      </DialogFooter>
    </div>
  );
}
