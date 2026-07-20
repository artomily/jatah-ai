import { round4, startOfToday } from "@/lib/format";
import { getAgentById } from "@/lib/data/agents";
import type {
  Agent,
  AgentPricing,
  BillingModel,
  Category,
  OwnedPass,
  PassType,
  Provider,
  Transaction,
} from "@/lib/types";

const DAY = 24 * 60 * 60 * 1000;

type CreatorPricingOverrides = Record<string, Partial<Record<BillingModel, boolean>>>;

/**
 * The pricing an agent's page actually offers: the creator's static pricing
 * minus any billing models toggled off in the creator dashboard.
 */
export function getEffectivePricing(
  agent: Agent,
  overrides: CreatorPricingOverrides,
): AgentPricing {
  const o = overrides[agent.id] ?? {};
  const passes: AgentPricing["passes"] = {};
  for (const [type, price] of Object.entries(agent.pricing.passes)) {
    if (o[type as PassType] !== false) passes[type as PassType] = price;
  }
  return {
    ...(agent.pricing.perRequest && o.perRequest !== false
      ? { perRequest: agent.pricing.perRequest }
      : {}),
    passes,
  };
}

export function getActivePass(
  passes: OwnedPass[],
  agentId: string,
  now: number,
): OwnedPass | undefined {
  return passes.find(
    (p) => p.agentId === agentId && p.activatedAt <= now && p.expiresAt > now,
  );
}

export function getActiveModelPass(
  passes: OwnedPass[],
  modelId: string,
  now: number,
): OwnedPass | undefined {
  return passes.find(
    (p) => p.modelId === modelId && p.activatedAt <= now && p.expiresAt > now,
  );
}

/** Active tier bundle pass covering this model, if any — ignores token budget. */
export function getActiveTierPass(
  passes: OwnedPass[],
  modelId: string,
  now: number,
): OwnedPass | undefined {
  return passes.find(
    (p) =>
      p.tierId != null &&
      p.modelIds?.includes(modelId) &&
      p.activatedAt <= now &&
      p.expiresAt > now,
  );
}

/**
 * Whichever pass currently exempts this model from per-request billing: a
 * direct model pass (unlimited calls), or an active tier pass that still has
 * token budget left. Direct passes take priority since they have no cap.
 * Once a tier's shared budget is spent, calls just fall back to per-request
 * billing — the pass itself keeps counting down to expiry either way.
 */
export function getModelCoverage(
  passes: OwnedPass[],
  modelId: string,
  now: number,
): OwnedPass | undefined {
  const direct = getActiveModelPass(passes, modelId, now);
  if (direct) return direct;
  const tier = getActiveTierPass(passes, modelId, now);
  if (tier && (tier.tokenLimit ?? 0) - (tier.tokensUsed ?? 0) > 0) return tier;
  return undefined;
}

/** Per-model token usage attributed to one tier pass — powers the tier's usage chart. */
export function tierTokenUsageByModel(
  transactions: Transaction[],
  passId: string,
): Array<{ modelId: string; tokens: number }> {
  const map = new Map<string, number>();
  for (const t of transactions) {
    if (t.type !== "model_usage" || t.coveredByPassId !== passId || !t.modelId) continue;
    const tokens = (t.inputTokens ?? 0) + (t.outputTokens ?? 0);
    map.set(t.modelId, (map.get(t.modelId) ?? 0) + tokens);
  }
  return [...map.entries()].map(([modelId, tokens]) => ({ modelId, tokens }));
}

export function getActivePasses(passes: OwnedPass[], now: number): OwnedPass[] {
  return passes
    .filter((p) => p.expiresAt > now)
    .sort((a, b) => a.expiresAt - b.expiresAt);
}

export function getExpiredPasses(passes: OwnedPass[], now: number): OwnedPass[] {
  return passes
    .filter((p) => p.expiresAt <= now)
    .sort((a, b) => b.expiresAt - a.expiresAt);
}

/** All spending (usage + pass purchases) since t0. Spend is always derived, never stored. */
export function spentSince(transactions: Transaction[], t0: number): number {
  return round4(
    transactions
      .filter((t) => t.type !== "top_up" && t.createdAt >= t0)
      .reduce((s, t) => s + t.amount, 0),
  );
}

export function runsSince(transactions: Transaction[], t0: number): number {
  return transactions.filter((t) => t.type === "usage" && t.createdAt >= t0).length;
}

export interface DayBucket {
  /** Start-of-day timestamp (local). */
  day: number;
  spend: number;
  runs: number;
}

/** Trailing `days` calendar days including today, oldest first. */
export function bucketSpendByDay(
  transactions: Transaction[],
  days: number,
  now: number,
): DayBucket[] {
  const today = startOfToday(now);
  const buckets: DayBucket[] = Array.from({ length: days }, (_, i) => ({
    day: today - (days - 1 - i) * DAY,
    spend: 0,
    runs: 0,
  }));
  const first = buckets[0].day;
  for (const t of transactions) {
    if (t.type === "top_up" || t.createdAt < first || t.createdAt >= today + DAY) continue;
    const idx = Math.floor((t.createdAt - first) / DAY);
    if (idx < 0 || idx >= buckets.length) continue;
    buckets[idx].spend = round4(buckets[idx].spend + t.amount);
    if (t.type === "usage") buckets[idx].runs += 1;
  }
  return buckets;
}

export function spendByCategory(
  transactions: Transaction[],
  since: number,
): Array<{ category: Category; spend: number }> {
  const map = new Map<Category, number>();
  for (const t of transactions) {
    if (t.type !== "usage" || t.createdAt < since || !t.agentId) continue;
    const agent = getAgentById(t.agentId);
    if (!agent) continue;
    map.set(agent.category, (map.get(agent.category) ?? 0) + t.amount);
  }
  return [...map.entries()]
    .map(([category, spend]) => ({ category, spend: round4(spend) }))
    .filter((e) => e.spend > 0)
    .sort((a, b) => b.spend - a.spend);
}

/** Charged spend per provider, from receipt breakdown lines (covered runs excluded). */
export function spendByProvider(
  transactions: Transaction[],
  since: number,
): Array<{ provider: Provider; spend: number }> {
  const map = new Map<Provider, number>();
  for (const t of transactions) {
    if (t.type !== "usage" || t.createdAt < since || !t.breakdown || t.coveredByPassId)
      continue;
    for (const line of t.breakdown) {
      // "usage" transactions (agent runs) always carry a real Provider —
      // "input"/"output" lines only ever appear on "model_usage" transactions.
      const provider = line.provider as Provider;
      map.set(provider, (map.get(provider) ?? 0) + line.amount);
    }
  }
  return [...map.entries()]
    .map(([provider, spend]) => ({ provider, spend: round4(spend) }))
    .sort((a, b) => b.spend - a.spend);
}

export interface AgentSpend {
  agentId: string;
  agentName: string;
  spend: number;
  runs: number;
}

export function topAgentsBySpend(
  transactions: Transaction[],
  since: number,
  limit = 5,
): AgentSpend[] {
  const map = new Map<string, AgentSpend>();
  for (const t of transactions) {
    if (t.type !== "usage" || t.createdAt < since || !t.agentId) continue;
    const entry = map.get(t.agentId) ?? {
      agentId: t.agentId,
      agentName: t.agentName ?? t.agentId,
      spend: 0,
      runs: 0,
    };
    entry.spend = round4(entry.spend + t.amount);
    entry.runs += 1;
    map.set(t.agentId, entry);
  }
  return [...map.values()]
    .sort((a, b) => b.spend - a.spend || b.runs - a.runs)
    .slice(0, limit);
}

export interface UsageSummary {
  totalSpend: number;
  totalRuns: number;
  avgCostPerRun: number;
  passCoveredShare: number;
  capProtectedCount: number;
}

export function summarizeUsage(transactions: Transaction[], since: number): UsageSummary {
  const usage = transactions.filter((t) => t.type === "usage" && t.createdAt >= since);
  const totalSpend = round4(usage.reduce((s, t) => s + t.amount, 0));
  const charged = usage.filter((t) => !t.coveredByPassId);
  return {
    totalSpend,
    totalRuns: usage.length,
    avgCostPerRun: charged.length ? round4(totalSpend / charged.length) : 0,
    passCoveredShare: usage.length
      ? usage.filter((t) => t.coveredByPassId).length / usage.length
      : 0,
    capProtectedCount: usage.filter((t) => t.cappedOverrun).length,
  };
}
