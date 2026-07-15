"use client";

import { useCallback, useEffect, useState } from "react";
import { ensureStellarWalletsKit, KitEventType, StellarWalletsKit } from "@/lib/stellar/wallet-kit";

export interface UseStellarWallet {
  address: string | null;
  /** False until the kit has reported its initial (possibly restored) state. */
  ready: boolean;
  connecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}

/** Reflects the shared StellarWalletsKit connection state — same across every mount. */
export function useStellarWallet(): UseStellarWallet {
  const [address, setAddress] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    ensureStellarWalletsKit();
    return StellarWalletsKit.on(KitEventType.STATE_UPDATED, (event) => {
      setAddress(event.payload.address ?? null);
      setReady(true);
    });
  }, []);

  const connect = useCallback(async () => {
    setConnecting(true);
    try {
      await StellarWalletsKit.authModal();
    } catch {
      // User closed the modal or the wallet rejected the connection — nothing to surface.
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    await StellarWalletsKit.disconnect();
  }, []);

  return { address, ready, connecting, connect, disconnect };
}
