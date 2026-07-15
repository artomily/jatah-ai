"use client";

import { Check, Copy, ExternalLink, Wallet2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  formatXlm,
  stellarExplorerAccountUrl,
  truncateStellarAddress,
} from "@/lib/stellar/config";
import { fundTestnetAccount } from "@/lib/stellar/payments";
import { useOnChainCredited } from "@/hooks/use-onchain-credited";
import { useStellarBalance } from "@/hooks/use-stellar-balance";
import { useStellarWallet } from "@/hooks/use-stellar-wallet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function StellarWalletCard() {
  const { address, ready, connecting, connect, disconnect } = useStellarWallet();
  const { balance, loading, notFound, refresh } = useStellarBalance(address);
  const [copied, setCopied] = useState(false);
  const [funding, setFunding] = useState(false);
  const [creditedRefreshKey, setCreditedRefreshKey] = useState(0);
  const credited = useOnChainCredited(address, creditedRefreshKey);

  const copyAddress = async () => {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleFund = async () => {
    if (!address) return;
    setFunding(true);
    try {
      await fundTestnetAccount(address);
      toast.success("Funded 10,000 testnet XLM");
      refresh();
      setCreditedRefreshKey((k) => k + 1);
    } catch {
      toast.error("Friendbot funding failed. Try again in a moment.");
    } finally {
      setFunding(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 rounded-xl border bg-card p-6 shadow-card">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Stellar wallet</p>
        <Badge variant="outline">Testnet</Badge>
      </div>

      {!ready ? (
        <Skeleton className="h-10 w-40" />
      ) : !address ? (
        <>
          <p className="text-sm text-muted-foreground">
            Connect a Stellar wallet to pay for top-ups with testnet XLM.
          </p>
          <Button className="self-start" onClick={connect} disabled={connecting}>
            <Wallet2 aria-hidden />
            {connecting ? "Connecting…" : "Connect wallet"}
          </Button>
        </>
      ) : (
        <>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <p className="font-mono text-lg font-semibold tracking-tight">
                {truncateStellarAddress(address)}
              </p>
              <button
                type="button"
                onClick={copyAddress}
                className="rounded p-1 text-muted-foreground outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Copy address"
              >
                {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
              </button>
              <a
                href={stellarExplorerAccountUrl(address)}
                target="_blank"
                rel="noreferrer"
                className="rounded p-1 text-muted-foreground outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="View on Stellar Expert"
              >
                <ExternalLink className="size-3.5" />
              </a>
            </div>
            <p className="text-sm text-muted-foreground tabular-nums">
              {loading ? "Loading balance…" : notFound ? "Not funded on testnet" : formatXlm(balance)}
            </p>
            {credited != null && credited > 0 && (
              <p className="text-xs text-muted-foreground tabular-nums">
                {formatXlm(credited)} credited on-chain via top-up contract
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {notFound && (
              <Button size="sm" variant="outline" onClick={handleFund} disabled={funding}>
                {funding ? "Funding…" : "Fund via Friendbot"}
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={disconnect}>
              Disconnect
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
