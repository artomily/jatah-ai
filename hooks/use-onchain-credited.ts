"use client";

import { useEffect, useState } from "react";
import { stroopsToXlm } from "@/lib/stellar/config";
import { getCreditedOnChain } from "@/lib/stellar/soroban";

/** Lifetime XLM the connected wallet has paid through the Soroban top-up contract. */
export function useOnChainCredited(address: string | null, refreshKey: number): number | null {
  const [trackedAddress, setTrackedAddress] = useState(address);
  const [credited, setCredited] = useState<number | null>(null);

  if (trackedAddress !== address) {
    setTrackedAddress(address);
    setCredited(null);
  }

  useEffect(() => {
    if (!address) return;
    let cancelled = false;
    getCreditedOnChain(address)
      .then((stroops) => {
        if (!cancelled) setCredited(stroopsToXlm(stroops));
      })
      .catch(() => {
        // Account not yet funded/known to the network — leave as null.
      });
    return () => {
      cancelled = true;
    };
  }, [address, refreshKey]);

  return credited;
}
