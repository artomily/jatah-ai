"use client";

import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { formatMoneyExact } from "@/lib/format";
import {
  formatXlm,
  stellarExplorerTxUrl,
  truncateStellarAddress,
} from "@/lib/stellar/config";
import { StellarAccountNotFoundError, fundTestnetAccount, payTreasuryDirect } from "@/lib/stellar/payments";
import { useStellarWallet } from "@/hooks/use-stellar-wallet";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";

/**
 * One-off native-XLM payment straight from a connected Stellar wallet to the
 * treasury, for a fixed price — used for time-pass purchases instead of the
 * running top-up balance (see `payTreasuryDirect`).
 */
export function StellarDirectPay({
  amountUsd,
  amountXlm,
  onPaid,
  onCancel,
}: {
  amountUsd: number;
  amountXlm: number;
  onPaid: (txHash: string) => void;
  onCancel: () => void;
}) {
  const { address, ready, connecting, connect } = useStellarWallet();
  const [paying, setPaying] = useState(false);
  const [notFunded, setNotFunded] = useState(false);
  const [funding, setFunding] = useState(false);

  const pay = async () => {
    if (!address) return;
    setPaying(true);
    setNotFunded(false);
    try {
      const hash = await payTreasuryDirect(address, amountXlm);
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
      onPaid(hash);
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
          Connect a Stellar wallet to pay {formatXlm(amountXlm)} directly — no prepaid
          balance involved, the payment settles straight to the treasury.
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
      <div className="flex items-center justify-between rounded-lg border px-3.5 py-2.5 text-sm">
        <span className="text-muted-foreground">Amount</span>
        <span className="font-medium tabular-nums">
          {formatXlm(amountXlm)}{" "}
          <span className="text-muted-foreground">({formatMoneyExact(amountUsd)})</span>
        </span>
      </div>

      {notFunded && (
        <div className="flex flex-col gap-2 rounded-lg border bg-muted/40 p-3">
          <p className="text-xs text-muted-foreground">This wallet has no testnet XLM yet.</p>
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
          {paying ? "Confirming…" : `Pay ${formatXlm(amountXlm)}`}
        </Button>
      </DialogFooter>
    </div>
  );
}
