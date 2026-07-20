import { usdToXlm } from "@/lib/stellar/config";
import { verifyTreasuryPayment } from "@/lib/server/stellar-verify";

/** Matches the memo format StellarDirectPay writes: `jatah:` + 8 alphanumerics. */
const ORDER_ID_RE = /^jatah:[a-z0-9]{8}$/;
const TX_HASH_RE = /^[a-f0-9]{64}$/;

export async function POST(request: Request) {
  let body: { txHash?: unknown; amountUsd?: unknown; orderId?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, reason: "invalid_json" }, { status: 400 });
  }

  const { txHash, amountUsd, orderId } = body;
  if (
    typeof txHash !== "string" ||
    !TX_HASH_RE.test(txHash) ||
    typeof orderId !== "string" ||
    !ORDER_ID_RE.test(orderId) ||
    typeof amountUsd !== "number" ||
    !Number.isFinite(amountUsd) ||
    amountUsd <= 0
  ) {
    return Response.json({ ok: false, reason: "invalid_request" }, { status: 400 });
  }

  // Price is recomputed server-side from the USD amount — the client never
  // supplies the XLM figure the check runs against.
  const result = await verifyTreasuryPayment({
    txHash,
    expectedXlm: usdToXlm(amountUsd),
    memo: orderId,
  });

  if (!result.ok) {
    const status = result.reason === "horizon_error" ? 502 : 422;
    return Response.json(result, { status });
  }

  // Shaped like the future entitlements DB row — see the auth sprint.
  return Response.json({
    ok: true,
    orderId,
    txHash,
    amountXlm: result.amountXlm,
    verifiedAt: result.verifiedAt,
  });
}
