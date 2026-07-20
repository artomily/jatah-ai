/**
 * Server-only Midtrans SANDBOX client — Snap token creation and status checks
 * via plain fetch, no SDK. Real money never moves; production keys are a
 * different base URL and a KYB process away (out of scope for the demo).
 */

const SNAP_BASE_URL = "https://app.sandbox.midtrans.com/snap/v1";
const API_BASE_URL = "https://api.sandbox.midtrans.com/v2";

export class MidtransError extends Error {
  constructor(
    public code: "not_configured" | "upstream_error",
    message: string,
  ) {
    super(message);
    this.name = "MidtransError";
  }
}

function authHeader(): string {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  if (!serverKey) {
    throw new MidtransError("not_configured", "MIDTRANS_SERVER_KEY is not set");
  }
  return `Basic ${Buffer.from(`${serverKey}:`).toString("base64")}`;
}

export async function createSnapToken({
  orderId,
  grossAmountIdr,
  itemName,
}: {
  orderId: string;
  grossAmountIdr: number;
  itemName: string;
}): Promise<string> {
  let res: Response;
  try {
    res = await fetch(`${SNAP_BASE_URL}/transactions`, {
      method: "POST",
      headers: {
        Authorization: authHeader(),
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        transaction_details: { order_id: orderId, gross_amount: grossAmountIdr },
        item_details: [
          { id: orderId, price: grossAmountIdr, quantity: 1, name: itemName.slice(0, 50) },
        ],
        enabled_payments: ["qris", "gopay", "shopeepay"],
      }),
      signal: AbortSignal.timeout(15_000),
    });
  } catch (err) {
    if (err instanceof MidtransError) throw err;
    throw new MidtransError("upstream_error", "Midtrans request failed or timed out");
  }

  const data = (await res.json().catch(() => null)) as {
    token?: string;
    error_messages?: string[];
  } | null;
  if (!res.ok || !data?.token) {
    throw new MidtransError(
      "upstream_error",
      data?.error_messages?.join("; ") ?? `Midtrans responded ${res.status}`,
    );
  }
  return data.token;
}

export interface MidtransStatus {
  orderId: string;
  status: string;
  grossAmount: number;
}

/** Settlement statuses that count as paid for the demo grant. */
export const PAID_STATUSES = new Set(["settlement", "capture"]);

export async function getStatus(orderId: string): Promise<MidtransStatus | null> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}/${encodeURIComponent(orderId)}/status`, {
      headers: { Authorization: authHeader(), Accept: "application/json" },
      signal: AbortSignal.timeout(15_000),
    });
  } catch (err) {
    if (err instanceof MidtransError) throw err;
    throw new MidtransError("upstream_error", "Midtrans request failed or timed out");
  }

  const data = (await res.json().catch(() => null)) as {
    status_code?: string;
    transaction_status?: string;
    gross_amount?: string;
  } | null;
  if (data?.status_code === "404" || res.status === 404) return null;
  if (!res.ok || !data?.transaction_status) {
    throw new MidtransError("upstream_error", `Midtrans responded ${res.status}`);
  }
  return {
    orderId,
    status: data.transaction_status,
    grossAmount: Number.parseFloat(data.gross_amount ?? "0"),
  };
}
