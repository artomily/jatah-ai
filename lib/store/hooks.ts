"use client";

import { useAppStore, useHydrated } from "@/lib/store/app-store";
import { getEffectivePricing, getModelCoverage } from "@/lib/store/selectors";
import { useNow } from "@/hooks/use-now";
import type { Agent, AgentPricing, OwnedPass } from "@/lib/types";

/**
 * The pricing an agent currently offers, respecting creator-dashboard toggles.
 * Falls back to the static catalog pricing until the store hydrates, so server
 * and first client render stay identical.
 */
export function useEffectivePricing(agent: Agent): AgentPricing {
  const hydrated = useHydrated();
  const overrides = useAppStore((s) => s.creatorPricing);
  if (!hydrated) return agent.pricing;
  return getEffectivePricing(agent, overrides);
}

/**
 * Whichever pass currently exempts this model from per-request billing — a
 * direct model pass, or an active tier bundle with token budget left. Drives
 * lock/unlock badges and countdowns wherever models are listed. `undefined`
 * before hydration/clock mount, same as genuinely no coverage.
 */
export function useModelCoverage(modelId: string): OwnedPass | undefined {
  const hydrated = useHydrated();
  const passes = useAppStore((s) => s.passes);
  const now = useNow();
  if (!hydrated || now == null) return undefined;
  return getModelCoverage(passes, modelId, now);
}
