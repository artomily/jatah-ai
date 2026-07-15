"use client";

import { useCallback, useEffect, useState } from "react";
import { horizonServer } from "@/lib/stellar/payments";

export interface UseStellarBalance {
  balance: number | null;
  loading: boolean;
  /** True once a lookup has confirmed the account doesn't exist on testnet yet. */
  notFound: boolean;
  refresh: () => void;
}

/** Native XLM balance for a testnet account, refetched whenever `address` changes. */
export function useStellarBalance(address: string | null): UseStellarBalance {
  const [trackedAddress, setTrackedAddress] = useState(address);
  const [balance, setBalance] = useState<number | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);
  const [resolvedKey, setResolvedKey] = useState<string | null>(null);

  // Reset derived state synchronously during render when the address itself changes,
  // instead of via a setState call inside the effect body.
  if (trackedAddress !== address) {
    setTrackedAddress(address);
    setBalance(null);
    setNotFound(false);
  }

  const currentKey = address ? `${address}:${refreshToken}` : null;

  useEffect(() => {
    if (!address) return;
    const key = `${address}:${refreshToken}`;
    let cancelled = false;
    horizonServer
      .loadAccount(address)
      .then((account) => {
        if (cancelled) return;
        const native = account.balances.find((b) => b.asset_type === "native");
        setBalance(native ? Number(native.balance) : 0);
        setNotFound(false);
        setResolvedKey(key);
      })
      .catch((err) => {
        if (cancelled) return;
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status === 404) {
          setNotFound(true);
          setBalance(null);
        }
        setResolvedKey(key);
      });
    return () => {
      cancelled = true;
    };
  }, [address, refreshToken]);

  const refresh = useCallback(() => setRefreshToken((t) => t + 1), []);

  return { balance, loading: currentKey !== null && currentKey !== resolvedKey, notFound, refresh };
}
