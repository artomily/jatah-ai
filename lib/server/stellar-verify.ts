import { STELLAR_HORIZON_URL, STELLAR_TREASURY_ADDRESS } from "@/lib/stellar/config";

/** Payments older than this are rejected — an order should verify right after it settles. */
const MAX_TX_AGE_MS = 15 * 60 * 1000;
const XLM_TOLERANCE = 1e-7;

/**
 * Same-instance replay guard: a tx hash grants exactly one entitlement.
 * In-memory only — resets per serverless instance. Good enough for the demo;
 * a database unique constraint replaces this when auth/persistence lands.
 */
const consumedTxHashes = new Set<string>();

export type StellarVerifyFailure =
  | "tx_not_found"
  | "tx_failed"
  | "wrong_recipient"
  | "wrong_asset"
  | "insufficient_amount"
  | "wrong_memo"
  | "tx_too_old"
  | "already_used"
  | "horizon_error";

export type StellarVerifyResult =
  | { ok: true; verifiedAt: number; amountXlm: number }
  | { ok: false; reason: StellarVerifyFailure };

interface HorizonTransaction {
  successful?: boolean;
  created_at?: string;
  memo_type?: string;
  memo?: string;
}

interface HorizonOperation {
  type: string;
  asset_type?: string;
  to?: string;
  amount?: string;
}

/**
 * Verifies a native-XLM payment to the demo treasury on Horizon testnet:
 * tx succeeded, recipient and asset match, amount covers the order, the text
 * memo carries the order id, and the tx is recent and not yet consumed.
 */
export async function verifyTreasuryPayment({
  txHash,
  expectedXlm,
  memo,
}: {
  txHash: string;
  expectedXlm: number;
  memo: string;
}): Promise<StellarVerifyResult> {
  if (consumedTxHashes.has(txHash)) return { ok: false, reason: "already_used" };

  let tx: HorizonTransaction;
  let ops: { _embedded?: { records?: HorizonOperation[] } };
  try {
    const encoded = encodeURIComponent(txHash);
    const [txRes, opsRes] = await Promise.all([
      fetch(`${STELLAR_HORIZON_URL}/transactions/${encoded}`),
      fetch(`${STELLAR_HORIZON_URL}/transactions/${encoded}/operations`),
    ]);
    if (txRes.status === 404 || opsRes.status === 404) {
      return { ok: false, reason: "tx_not_found" };
    }
    if (!txRes.ok || !opsRes.ok) return { ok: false, reason: "horizon_error" };
    tx = (await txRes.json()) as HorizonTransaction;
    ops = (await opsRes.json()) as { _embedded?: { records?: HorizonOperation[] } };
  } catch {
    return { ok: false, reason: "horizon_error" };
  }

  if (!tx.successful) return { ok: false, reason: "tx_failed" };

  const createdAt = tx.created_at ? Date.parse(tx.created_at) : NaN;
  if (!Number.isFinite(createdAt) || Date.now() - createdAt > MAX_TX_AGE_MS) {
    return { ok: false, reason: "tx_too_old" };
  }

  if (tx.memo_type !== "text" || tx.memo !== memo) {
    return { ok: false, reason: "wrong_memo" };
  }

  const payments = (ops._embedded?.records ?? []).filter((op) => op.type === "payment");
  const toTreasury = payments.filter((op) => op.to === STELLAR_TREASURY_ADDRESS);
  if (toTreasury.length === 0) {
    return { ok: false, reason: payments.length ? "wrong_recipient" : "tx_failed" };
  }

  const native = toTreasury.filter((op) => op.asset_type === "native");
  if (native.length === 0) return { ok: false, reason: "wrong_asset" };

  const paidXlm = native.reduce((sum, op) => sum + Number.parseFloat(op.amount ?? "0"), 0);
  if (!(paidXlm >= expectedXlm - XLM_TOLERANCE)) {
    return { ok: false, reason: "insufficient_amount" };
  }

  consumedTxHashes.add(txHash);
  return { ok: true, verifiedAt: Date.now(), amountXlm: paidXlm };
}
