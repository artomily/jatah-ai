import { Horizon } from "@stellar/stellar-sdk";
import { STELLAR_FRIENDBOT_URL, STELLAR_HORIZON_URL } from "@/lib/stellar/config";

/** Used for read-only lookups (balances) — contract payments go through Soroban RPC. */
export const horizonServer = new Horizon.Server(STELLAR_HORIZON_URL);

export class StellarAccountNotFoundError extends Error {
  constructor(public address: string) {
    super(`Account ${address} isn't funded on testnet yet.`);
    this.name = "StellarAccountNotFoundError";
  }
}

/** Friendbot-funds a testnet account — dev convenience for wallets with no test XLM. */
export async function fundTestnetAccount(address: string): Promise<void> {
  const res = await fetch(`${STELLAR_FRIENDBOT_URL}/?addr=${encodeURIComponent(address)}`);
  if (!res.ok && res.status !== 400) {
    throw new Error("Friendbot funding failed. Try again in a moment.");
  }
}
