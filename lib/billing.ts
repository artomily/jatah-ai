import { round4 } from "@/lib/format";
import { PROVIDER_META } from "@/lib/data/providers";
import type { CostLine, ModelRateCard, PerRequestPricing, Provider } from "@/lib/types";

export type Rng = () => number;

/** Deterministic PRNG for reproducible seed data. */
export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let idCounter = 0;
export function makeId(prefix: string, rng: Rng = Math.random): string {
  idCounter += 1;
  const salt = Math.floor(rng() * 36 ** 6)
    .toString(36)
    .padStart(6, "0");
  return `${prefix}_${salt}${(idCounter % 36).toString(36)}`;
}

const KEY_ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";

/** Cosmetic secret for the demo — never used to authenticate anything real. */
export function generateApiKeySecret(rng: Rng = Math.random): string {
  let body = "";
  for (let i = 0; i < 40; i++) {
    body += KEY_ALPHABET[Math.floor(rng() * KEY_ALPHABET.length)];
  }
  return `jatah_sk_${body}`;
}

/** Execution time really elapses in the run flow and prints on the receipt. */
export function rollExecutionMs(avgExecutionMs: number, rng: Rng = Math.random): number {
  const rolled = avgExecutionMs * (0.7 + rng() * 0.6);
  return Math.round(Math.min(Math.max(rolled, 1200), 3200));
}

/**
 * 80% of runs land inside the estimate; 20% exceed it and are charged the cap —
 * never more. The overrun receipt is the transparency story.
 */
export function rollActualCost(
  pricing: PerRequestPricing,
  rng: Rng = Math.random,
): { amount: number; cappedOverrun: boolean } {
  if (rng() < 0.8) {
    return {
      amount: round4(pricing.estMin + rng() * (pricing.estMax - pricing.estMin)),
      cappedOverrun: false,
    };
  }
  return { amount: round4(pricing.cap), cappedOverrun: true };
}

/**
 * Splits a total across the agent's providers with random weights.
 * The last line absorbs the rounding remainder so lines always sum exactly.
 */
export function buildBreakdown(
  providers: Provider[],
  total: number,
  rng: Rng = Math.random,
): CostLine[] {
  const weights = providers.map(() => 0.35 + rng());
  const weightSum = weights.reduce((s, w) => s + w, 0);
  const lines: CostLine[] = providers.map((provider, i) => ({
    provider,
    label: PROVIDER_META[provider].receiptLabel,
    amount: round4((total * weights[i]) / weightSum),
  }));
  const allocated = lines
    .slice(0, -1)
    .reduce((s, line) => s + line.amount, 0);
  lines[lines.length - 1].amount = round4(total - allocated);
  return lines;
}

/**
 * Splits a model call's total cost between input and output tokens, then
 * back-derives token counts from each side's dollar amount and the model's
 * rate card — so the two lines always sum exactly to `total`.
 */
export function buildTokenBreakdown(
  rateCard: ModelRateCard,
  total: number,
  rng: Rng = Math.random,
): { breakdown: CostLine[]; inputTokens: number; outputTokens: number } {
  const inputShare = 0.3 + rng() * 0.3;
  const inputAmount = round4(total * inputShare);
  const outputAmount = round4(total - inputAmount);
  const inputTokens = Math.round((inputAmount / rateCard.inputPerMillion) * 1_000_000);
  const outputTokens = Math.round((outputAmount / rateCard.outputPerMillion) * 1_000_000);
  const breakdown: CostLine[] = [
    {
      provider: "input",
      label: `Input tokens (${inputTokens.toLocaleString()})`,
      amount: inputAmount,
    },
    {
      provider: "output",
      label: `Output tokens (${outputTokens.toLocaleString()})`,
      amount: outputAmount,
    },
  ];
  return { breakdown, inputTokens, outputTokens };
}
