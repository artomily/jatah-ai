import { getModel } from "@/lib/data/models";
import type { AiModel, PassType } from "@/lib/types";

export interface Tier {
  id: string;
  slug: string;
  name: string;
  blurb: string;
  /** Shared across every model in `modelSlugs` for the life of the pass. */
  tokenLimit: number;
  modelSlugs: string[];
  passes: Partial<Record<PassType, { price: number }>>;
}

/**
 * Bundle passes: one price unlocks every model listed, sharing one token
 * budget for the pass window. Priced below buying each model's own pass
 * separately (where one exists) — and for durations no single model in the
 * tier sells on its own (e.g. Basic's 7-day option), the bundle is the only
 * way to get that access at all.
 */
export const TIERS: Tier[] = [
  {
    id: "tier_starter",
    slug: "starter",
    name: "Starter",
    blurb: "One fast model, priced for trying things out.",
    tokenLimit: 4_000_000,
    modelSlugs: ["claude-haiku-4-5"],
    passes: {
      pass_24h: { price: 1 },
    },
  },
  {
    id: "tier_basic",
    slug: "basic",
    name: "Basic",
    blurb: "Everyday utility calls — fast, cheap, always on.",
    tokenLimit: 8_000_000,
    modelSlugs: ["claude-haiku-4-5", "gpt-5-mini"],
    passes: {
      pass_24h: { price: 2 },
      pass_7d: { price: 6 },
    },
  },
  {
    id: "tier_plus",
    slug: "plus",
    name: "Plus",
    blurb: "Efficient open-weight pair for high-volume text work.",
    tokenLimit: 12_000_000,
    modelSlugs: ["mistral-large-3", "llama-4-maverick"],
    passes: {
      pass_24h: { price: 3 },
    },
  },
  {
    id: "tier_standard",
    slug: "standard",
    name: "Standard",
    blurb: "Most teams' daily driver — reasoning without the frontier price.",
    tokenLimit: 20_000_000,
    modelSlugs: ["claude-sonnet-5", "gemini-2-5-pro"],
    passes: {
      pass_24h: { price: 5 },
      pass_7d: { price: 15 },
    },
  },
  {
    id: "tier_pro",
    slug: "pro",
    name: "Pro",
    blurb: "Extra headroom for teams that outgrow Standard.",
    tokenLimit: 28_000_000,
    modelSlugs: ["claude-sonnet-5", "gemini-2-5-pro", "mistral-large-3"],
    passes: {
      pass_24h: { price: 6 },
      pass_7d: { price: 20 },
    },
  },
  {
    id: "tier_premium",
    slug: "premium",
    name: "Premium",
    blurb: "Frontier models for the runs that can't afford to be wrong.",
    tokenLimit: 40_000_000,
    modelSlugs: ["gpt-5", "claude-opus-4-8"],
    passes: {
      pass_24h: { price: 7 },
      pass_7d: { price: 25 },
    },
  },
];

/** Tiers listed under the Hourly (24h) pricing section — all six offer this duration. */
export const HOURLY_TIERS: Tier[] = TIERS.filter((t) => t.passes.pass_24h);

/** Tiers listed under the Weekly (7d) pricing section — a subset of the six. */
export const WEEKLY_TIERS: Tier[] = TIERS.filter((t) => t.passes.pass_7d);

export function getTier(slug: string): Tier | undefined {
  return TIERS.find((t) => t.slug === slug);
}

export function getTierById(id: string): Tier | undefined {
  return TIERS.find((t) => t.id === id);
}

export function tierModels(tier: Tier): AiModel[] {
  return tier.modelSlugs
    .map((slug) => getModel(slug))
    .filter((m): m is AiModel => m != null);
}
