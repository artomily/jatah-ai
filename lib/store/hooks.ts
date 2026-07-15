"use client";

import { useAppStore, useHydrated } from "@/lib/store/app-store";
import { getEffectivePricing } from "@/lib/store/selectors";
import type { Agent, AgentPricing } from "@/lib/types";

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
