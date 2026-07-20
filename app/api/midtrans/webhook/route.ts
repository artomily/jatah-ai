import { createHash } from "node:crypto";

/**
 * Midtrans payment notification endpoint. Entitlements don't depend on it (the
 * client polls `/api/midtrans/status` instead, which works without a public
 * URL) — this verifies and acknowledges notifications so the sandbox dashboard
 * shows a healthy webhook once the app is deployed.
 */
export async function POST(request: Request) {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  if (!serverKey) {
    return Response.json({ error: "not_configured" }, { status: 503 });
  }

  let body: {
    order_id?: unknown;
    status_code?: unknown;
    gross_amount?: unknown;
    signature_key?: unknown;
    transaction_status?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  const { order_id, status_code, gross_amount, signature_key } = body;
  if (
    typeof order_id !== "string" ||
    typeof status_code !== "string" ||
    typeof gross_amount !== "string" ||
    typeof signature_key !== "string"
  ) {
    return Response.json({ error: "invalid_request" }, { status: 400 });
  }

  const expected = createHash("sha512")
    .update(order_id + status_code + gross_amount + serverKey)
    .digest("hex");
  if (signature_key !== expected) {
    return Response.json({ error: "invalid_signature" }, { status: 403 });
  }

  console.log(
    `[midtrans] notification: order=${order_id} status=${String(body.transaction_status)} amount=${gross_amount}`,
  );
  return Response.json({ received: true });
}
