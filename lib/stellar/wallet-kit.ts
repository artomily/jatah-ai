"use client";

import { StellarWalletsKit, KitEventType, Networks } from "@creit.tech/stellar-wallets-kit";
import { defaultModules } from "@creit.tech/stellar-wallets-kit/modules/utils";

let initialized = false;

/** Idempotent — safe to call from every component that needs the kit. Browser-only. */
export function ensureStellarWalletsKit(): void {
  if (initialized || typeof window === "undefined") return;
  StellarWalletsKit.init({
    modules: defaultModules(),
    network: Networks.TESTNET,
  });
  initialized = true;
}

export { StellarWalletsKit, KitEventType };
