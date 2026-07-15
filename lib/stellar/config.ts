import { Networks } from "@stellar/stellar-sdk";

export const STELLAR_NETWORK_PASSPHRASE = Networks.TESTNET;
export const STELLAR_HORIZON_URL = "https://horizon-testnet.stellar.org";
export const STELLAR_SOROBAN_RPC_URL = "https://soroban-testnet.stellar.org";
export const STELLAR_FRIENDBOT_URL = "https://friendbot.stellar.org";

/** Demo treasury account — testnet only, funded via Friendbot, receive-only. */
export const STELLAR_TREASURY_ADDRESS =
  process.env.NEXT_PUBLIC_STELLAR_TREASURY_ADDRESS ??
  "GDR253LNWKUEKBJNLEPFHMG2MYJO7SDWMYCJEGJIZZRHD5ME6I324LXO";

/**
 * Soroban "top up" contract — pulls native XLM from the connected wallet into
 * the treasury and records a running on-chain credit per payer.
 * Source: contracts/topup-contract. Deployed to testnet.
 */
export const STELLAR_TOPUP_CONTRACT_ID =
  process.env.NEXT_PUBLIC_STELLAR_TOPUP_CONTRACT_ID ??
  "CAM2QRAEBLK74XRQZWTFNLFBBET3SSRPYAB5A65QHNCYC7YNJJX5F7LK";

/** Deterministic Stellar Asset Contract id for native XLM on testnet. */
export const STELLAR_NATIVE_TOKEN_CONTRACT_ID =
  "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC";

/** Display-only conversion for the demo wallet ledger — not a live market rate. */
export const XLM_USD_RATE = 0.1;

export const XLM_TOP_UP_PRESETS = [25, 50, 100] as const;

const STROOPS_PER_XLM = 10_000_000;

export function xlmToStroops(xlm: number): bigint {
  return BigInt(Math.round(xlm * STROOPS_PER_XLM));
}

export function stroopsToXlm(stroops: bigint | number): number {
  return Number(stroops) / STROOPS_PER_XLM;
}

export function xlmToUsd(xlm: number): number {
  return Math.round(xlm * XLM_USD_RATE * 100) / 100;
}

export function stellarExplorerTxUrl(hash: string): string {
  return `https://stellar.expert/explorer/testnet/tx/${hash}`;
}

export function stellarExplorerAccountUrl(address: string): string {
  return `https://stellar.expert/explorer/testnet/account/${address}`;
}

export function truncateStellarAddress(address: string): string {
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}

export function formatXlm(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "--";
  return `${n.toLocaleString("en-US", { maximumFractionDigits: 2 })} XLM`;
}
