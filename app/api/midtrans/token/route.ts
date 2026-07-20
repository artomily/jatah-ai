import { getAgentById } from "@/lib/data/agents";
import { getModelById } from "@/lib/data/models";
import { getTier } from "@/lib/data/tiers";
import { usdToIdr } from "@/lib/midtrans/config";
import { MidtransError, createSnapToken } from "@/lib/server/midtrans";
import type { PassType } from "@/lib/types";

const PASS_TYPES = new Set<string>(["pass_24h", "pass_7d", "pass_30d"]);
const MAX_TOP_UP_USD = 500;

const ORDER_ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";

function makeOrderId(kind: "model" | "agent" | "tier" | "topup"): string {
  let salt = "";
  for (let i = 0; i < 8; i++) {
    salt += ORDER_ALPHABET[Math.floor(Math.random() * ORDER_ALPHABET.length)];
  }
  return `jatah-${kind}-${salt}`;
}

/** Resolves the charge server-side — pass prices always come from the catalog,
 * never from the client. Returns null when the request doesn't map to a price. */
function resolveOrder(body: {
  purpose?: unknown;
  modelId?: unknown;
  agentId?: unknown;
  tierSlug?: unknown;
  passType?: unknown;
  amountUsd?: unknown;
}): { orderId: string; amountUsd: number; itemName: string } | null {
  switch (body.purpose) {
    case "tier_pass": {
      if (typeof body.tierSlug !== "string" || typeof body.passType !== "string") return null;
      if (!PASS_TYPES.has(body.passType)) return null;
      const tier = getTier(body.tierSlug);
      const price = tier?.passes[body.passType as PassType]?.price;
      if (!tier || price == null) return null;
      return {
        orderId: makeOrderId("tier"),
        amountUsd: price,
        itemName: `${tier.name} tier ${body.passType.replace("pass_", "")} pass`,
      };
    }
    case "model_pass": {
      if (typeof body.modelId !== "string" || typeof body.passType !== "string") return null;
      if (!PASS_TYPES.has(body.passType)) return null;
      const model = getModelById(body.modelId);
      const price = model?.pricing.passes[body.passType as PassType]?.price;
      if (!model || price == null) return null;
      return {
        orderId: makeOrderId("model"),
        amountUsd: price,
        itemName: `${model.name} ${body.passType.replace("pass_", "")} pass`,
      };
    }
    case "agent_pass": {
      if (typeof body.agentId !== "string" || typeof body.passType !== "string") return null;
      if (!PASS_TYPES.has(body.passType)) return null;
      const agent = getAgentById(body.agentId);
      const price = agent?.pricing.passes[body.passType as PassType]?.price;
      if (!agent || price == null) return null;
      return {
        orderId: makeOrderId("agent"),
        amountUsd: price,
        itemName: `${agent.name} ${body.passType.replace("pass_", "")} pass`,
      };
    }
    case "top_up": {
      const amount = body.amountUsd;
      if (typeof amount !== "number" || !Number.isFinite(amount)) return null;
      if (amount <= 0 || amount > MAX_TOP_UP_USD) return null;
      return {
        orderId: makeOrderId("topup"),
        amountUsd: Math.round(amount * 100) / 100,
        itemName: `Wallet top-up $${amount}`,
      };
    }
    default:
      return null;
  }
}

export async function POST(request: Request) {
  let body: Parameters<typeof resolveOrder>[0];
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  const order = resolveOrder(body);
  if (!order) {
    return Response.json({ error: "invalid_request" }, { status: 400 });
  }

  const grossAmountIdr = usdToIdr(order.amountUsd);
  try {
    const token = await createSnapToken({
      orderId: order.orderId,
      grossAmountIdr,
      itemName: order.itemName,
    });
    return Response.json({ token, orderId: order.orderId, grossAmountIdr });
  } catch (err) {
    if (err instanceof MidtransError && err.code === "not_configured") {
      return Response.json({ error: "not_configured" }, { status: 503 });
    }
    return Response.json({ error: "upstream_error" }, { status: 502 });
  }
}
