import {
  buildBreakdown,
  buildTokenBreakdown,
  generateApiKeySecret,
  makeId,
  mulberry32,
  rollActualCost,
  rollExecutionMs,
} from "@/lib/billing";
import { PASS_DURATIONS_MS, round4 } from "@/lib/format";
import { getAgentById } from "@/lib/data/agents";
import { getModelById } from "@/lib/data/models";
import type {
  ApiKey,
  Budgets,
  OwnedPass,
  PassType,
  Transaction,
} from "@/lib/types";

export interface SeedState {
  balance: number;
  transactions: Transaction[];
  passes: OwnedPass[];
  budgets: Budgets;
  apiKeys: ApiKey[];
}

const DAY = 24 * 60 * 60 * 1000;
const HOUR = 60 * 60 * 1000;

/** Agents the demo user leans on, weighted. */
const USAGE_POOL: Array<{ agentId: string; weight: number }> = [
  { agentId: "agent_scout", weight: 5 },
  { agentId: "agent_inboxzeroer", weight: 4 },
  { agentId: "agent_refactorbot", weight: 3 },
  { agentId: "agent_sheetsense", weight: 3 },
  { agentId: "agent_meeting-distiller", weight: 2 },
  { agentId: "agent_draftsman", weight: 2 },
  { agentId: "agent_pr-sentinel", weight: 2 },
  { agentId: "agent_pixelproof", weight: 1 },
  { agentId: "agent_citewise", weight: 1 },
  { agentId: "agent_regexsmith", weight: 1 },
];

const SAMPLE_PROMPTS: Record<string, string[]> = {
  agent_scout: [
    "Market landscape for usage-based billing infrastructure",
    "Who are the serious players in on-device inference?",
    "Recent regulatory movement on AI transparency in the EU",
  ],
  agent_inboxzeroer: [
    "Triage this morning's batch — flag anything from the design team",
    "Post-weekend inbox dig-out, drafts for anything urgent",
  ],
  agent_refactorbot: [
    "Extract the retry logic in lib/net into a shared module",
    "Retire the v1 config format across the repo",
  ],
  agent_sheetsense: [
    "Which region is dragging Q3 margins?",
    "Find duplicate vendor rows and rank by spend",
  ],
  "agent_meeting-distiller": [
    "Distill Tuesday's roadmap call — decisions and owners",
    "Summarize the incident retro for people who missed it",
  ],
  agent_draftsman: [
    "Draft the June changelog post from these notes",
    "First pass at the pricing update announcement",
  ],
  "agent_pr-sentinel": [
    "Review PR #482 — payment retry queue",
    "Review the schema migration in PR #501",
  ],
  agent_pixelproof: [
    "Compare checkout screenshots against the Figma spec",
  ],
  agent_citewise: [
    "Literature review: consumption-based pricing in SaaS",
  ],
  agent_regexsmith: [
    "Pattern to extract invoice IDs like INV-2024-00931",
  ],
};

/** Models the demo user calls directly via API key, weighted. */
const MODEL_USAGE_POOL: Array<{ modelId: string; weight: number }> = [
  { modelId: "model_claude-sonnet-5", weight: 5 },
  { modelId: "model_gpt-5-mini", weight: 4 },
  { modelId: "model_gpt-5", weight: 2 },
  { modelId: "model_gemini-2-5-pro", weight: 2 },
  { modelId: "model_claude-haiku-4-5", weight: 3 },
  { modelId: "model_mistral-large-3", weight: 1 },
];

const MODEL_SAMPLE_PROMPTS: Record<string, string[]> = {
  "model_claude-sonnet-5": [
    "Summarize this support ticket thread",
    "Rewrite this changelog entry for a non-technical audience",
    "Draft a first pass at the onboarding email",
  ],
  "model_gpt-5-mini": [
    "Classify these 40 tickets by urgency",
    "Extract line items from this invoice text",
  ],
  "model_gpt-5": ["Plan the migration steps for the billing schema change"],
  "model_gemini-2-5-pro": ["Summarize this 90-minute call transcript"],
  "model_claude-haiku-4-5": ["Tag these reviews by sentiment"],
  "model_mistral-large-3": ["Generate a JSON schema from this sample payload"],
};

function pickWeighted<T extends { weight: number }>(pool: T[], roll: number): T {
  const total = pool.reduce((s, p) => s + p.weight, 0);
  let target = roll * total;
  for (const item of pool) {
    target -= item.weight;
    if (target <= 0) return item;
  }
  return pool[pool.length - 1];
}

/**
 * Builds the first-visit demo state. Runs client-side after rehydration finds
 * empty storage — never at module scope, so timestamps stay relative to the
 * visitor's "now".
 */
export function buildSeedState(now: number): SeedState {
  const rng = mulberry32(0x5eed);
  const transactions: Transaction[] = [];

  transactions.push(
    {
      id: makeId("txn", rng),
      type: "top_up",
      createdAt: now - 28 * DAY + 3 * HOUR,
      amount: 30,
    },
    {
      id: makeId("txn", rng),
      type: "top_up",
      createdAt: now - 12 * DAY + 5 * HOUR,
      amount: 25,
    },
  );

  // Passes: one active 7 Day Sprint on Scout, two expired.
  const scoutPass: OwnedPass = {
    id: makeId("pass", rng),
    agentId: "agent_scout",
    type: "pass_7d",
    price: 9,
    activatedAt: now - 2 * DAY,
    expiresAt: now - 2 * DAY + PASS_DURATIONS_MS.pass_7d,
  };
  const inboxPass: OwnedPass = {
    id: makeId("pass", rng),
    agentId: "agent_inboxzeroer",
    type: "pass_24h",
    price: 2,
    activatedAt: now - 9 * DAY,
    expiresAt: now - 9 * DAY + PASS_DURATIONS_MS.pass_24h,
  };
  const refactorPass: OwnedPass = {
    id: makeId("pass", rng),
    agentId: "agent_refactorbot",
    type: "pass_7d",
    price: 15,
    activatedAt: now - 25 * DAY,
    expiresAt: now - 25 * DAY + PASS_DURATIONS_MS.pass_7d,
  };
  // One active model pass alongside the agent passes above.
  const sonnetPass: OwnedPass = {
    id: makeId("pass", rng),
    modelId: "model_claude-sonnet-5",
    type: "pass_7d",
    price: 10,
    activatedAt: now - 1 * DAY,
    expiresAt: now - 1 * DAY + PASS_DURATIONS_MS.pass_7d,
  };
  const passes = [scoutPass, inboxPass, refactorPass, sonnetPass];

  for (const pass of passes) {
    const agent = pass.agentId ? getAgentById(pass.agentId) : undefined;
    const model = pass.modelId ? getModelById(pass.modelId) : undefined;
    transactions.push({
      id: makeId("txn", rng),
      type: "pass_purchase",
      createdAt: pass.activatedAt,
      amount: pass.price,
      agentId: pass.agentId,
      agentName: agent?.name,
      modelId: pass.modelId,
      modelName: model?.name,
      passType: pass.type as PassType,
    });
  }

  // ~70 usage runs over the trailing 30 days, weighted toward recent days.
  const dayWeights = Array.from({ length: 30 }, (_, d) => ({ d, weight: 30 - d }));
  for (let i = 0; i < 70; i++) {
    const { d } = pickWeighted(dayWeights, rng());
    const { agentId } = pickWeighted(USAGE_POOL, rng());
    const agent = getAgentById(agentId);
    if (!agent?.pricing.perRequest) continue;

    // Business-hours timestamps; day 0 stays safely in the past.
    const hour = 9 + Math.floor(rng() * 9);
    let createdAt = now - d * DAY - (24 - hour) * HOUR + Math.floor(rng() * 50) * 60 * 1000;
    if (d === 0) createdAt = now - (1 + Math.floor(rng() * 5)) * HOUR;

    const coveringPass = passes.find(
      (p) =>
        p.agentId === agentId &&
        createdAt >= p.activatedAt &&
        createdAt <= p.expiresAt,
    );

    const pricing = agent.pricing.perRequest;
    const overrun = rng() < 0.12;
    const amount = coveringPass
      ? 0
      : overrun
        ? round4(pricing.cap)
        : round4(pricing.estMin + rng() * (pricing.estMax - pricing.estMin));
    const referenceCost = round4(
      pricing.estMin + rng() * (pricing.estMax - pricing.estMin),
    );

    const prompts = SAMPLE_PROMPTS[agentId] ?? ["Ad hoc task"];
    transactions.push({
      id: makeId("txn", rng),
      type: "usage",
      createdAt,
      amount,
      agentId,
      agentName: agent.name,
      taskPrompt: prompts[Math.floor(rng() * prompts.length)],
      breakdown: buildBreakdown(
        agent.providersUsed,
        coveringPass ? referenceCost : amount,
        rng,
      ),
      executionMs: rollExecutionMs(agent.avgExecutionMs, rng),
      estimate: pricing,
      cappedOverrun: !coveringPass && overrun,
      ...(coveringPass
        ? { coveredByPassId: coveringPass.id, coveredByPassType: coveringPass.type }
        : {}),
    });
  }

  // ~25 direct model calls over the trailing 30 days.
  for (let i = 0; i < 25; i++) {
    const { d } = pickWeighted(dayWeights, rng());
    const { modelId } = pickWeighted(MODEL_USAGE_POOL, rng());
    const model = getModelById(modelId);
    if (!model) continue;

    const hour = 9 + Math.floor(rng() * 9);
    let createdAt = now - d * DAY - (24 - hour) * HOUR + Math.floor(rng() * 50) * 60 * 1000;
    if (d === 0) createdAt = now - (1 + Math.floor(rng() * 5)) * HOUR;

    const coveringPass = passes.find(
      (p) =>
        p.modelId === modelId && createdAt >= p.activatedAt && createdAt <= p.expiresAt,
    );

    const { amount, cappedOverrun } = rollActualCost(model.pricing.perRequest, rng);
    const referenceCost = round4(
      model.pricing.perRequest.estMin +
        rng() * (model.pricing.perRequest.estMax - model.pricing.perRequest.estMin),
    );
    const { breakdown, inputTokens, outputTokens } = buildTokenBreakdown(
      model.pricing.rateCard,
      coveringPass ? referenceCost : amount,
      rng,
    );

    const prompts = MODEL_SAMPLE_PROMPTS[modelId] ?? ["API call"];
    transactions.push({
      id: makeId("txn", rng),
      type: "model_usage",
      createdAt,
      amount: coveringPass ? 0 : amount,
      modelId,
      modelName: model.name,
      taskPrompt: prompts[Math.floor(rng() * prompts.length)],
      breakdown,
      inputTokens,
      outputTokens,
      executionMs: rollExecutionMs(1800, rng),
      estimate: model.pricing.perRequest,
      cappedOverrun: !coveringPass && cappedOverrun,
      ...(coveringPass
        ? { coveredByPassId: coveringPass.id, coveredByPassType: coveringPass.type }
        : {}),
    });
  }

  transactions.sort((a, b) => b.createdAt - a.createdAt);

  const credits = transactions
    .filter((t) => t.type === "top_up")
    .reduce((s, t) => s + t.amount, 0);
  const debits = transactions
    .filter((t) => t.type !== "top_up")
    .reduce((s, t) => s + t.amount, 0);

  const productionKey: ApiKey = {
    id: makeId("key", rng),
    label: "Production",
    modelId: "model_claude-sonnet-5",
    secret: generateApiKeySecret(rng),
    last4: "",
    createdAt: now - 20 * DAY,
    lastUsedAt: now - 2 * HOUR,
    revokedAt: null,
  };
  productionKey.last4 = productionKey.secret.slice(-4);

  return {
    balance: round4(credits - debits),
    transactions,
    passes,
    budgets: { daily: 2.5, weekly: 12, monthly: 40 },
    apiKeys: [productionKey],
  };
}
