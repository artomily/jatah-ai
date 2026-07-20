import { MidtransError, PAID_STATUSES, getStatus } from "@/lib/server/midtrans";

const ORDER_ID_RE = /^jatah-(model|agent|tier|topup)-[a-z0-9]{8}$/;

/** Polled by the client after Snap reports success — the server-side settlement
 * check that stands in for the webhook during local dev. */
export async function GET(request: Request) {
  const orderId = new URL(request.url).searchParams.get("orderId");
  if (!orderId || !ORDER_ID_RE.test(orderId)) {
    return Response.json({ ok: false, error: "invalid_request" }, { status: 400 });
  }

  try {
    const status = await getStatus(orderId);
    if (!status) {
      return Response.json({ ok: false, error: "order_not_found" }, { status: 404 });
    }
    return Response.json({
      ok: PAID_STATUSES.has(status.status),
      status: status.status,
      grossAmount: status.grossAmount,
    });
  } catch (err) {
    if (err instanceof MidtransError && err.code === "not_configured") {
      return Response.json({ ok: false, error: "not_configured" }, { status: 503 });
    }
    return Response.json({ ok: false, error: "upstream_error" }, { status: 502 });
  }
}
