"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { toast } from "sonner";
import {
  buildBreakdown,
  buildRealTokenBreakdown,
  buildTokenBreakdown,
  generateApiKeySecret,
  makeId,
  rollActualCost,
  rollExecutionMs,
} from "@/lib/billing";
import {
  BUDGET_WINDOW_LABELS,
  PASS_DURATIONS_MS,
  PASS_LABELS,
  budgetWindowStart,
  formatMoney,
  formatMoneyExact,
  round4,
} from "@/lib/format";
import { getAgentById } from "@/lib/data/agents";
import { getModelById } from "@/lib/data/models";
import { getTier, tierModels } from "@/lib/data/tiers";
import { buildSeedState } from "@/lib/data/seed";
import type {
  ApiKey,
  BillingModel,
  BudgetWindow,
  Budgets,
  CostLine,
  OwnedPass,
  PassType,
  PerRequestPricing,
  Transaction,
} from "@/lib/types";
import {
  getActivePass,
  getEffectivePricing,
  getModelCoverage,
  spentSince,
} from "@/lib/store/selectors";

export type RunPhase =
  | "estimating"
  | "review"
  | "confirm_budget"
  | "running"
  | "receipt";

export interface BudgetWarning {
  window: BudgetWindow;
  cap: number;
  remaining: number;
}

export interface RunState {
  phase: RunPhase;
  runToken: number;
  agentId: string;
  taskPrompt: string;
  estimate: PerRequestPricing;
  executionMs: number;
  coveredByPass?: OwnedPass;
  budgetWarning?: BudgetWarning;
  receipt?: Transaction;
}

export interface ModelRunState {
  phase: RunPhase;
  runToken: number;
  modelId: string;
  taskPrompt: string;
  estimate: PerRequestPricing;
  executionMs: number;
  coveredByPass?: OwnedPass;
  budgetWarning?: BudgetWarning;
  receipt?: Transaction;
}

export type CreatorPricingOverrides = Record<
  string,
  Partial<Record<BillingModel, boolean>>
>;

interface AppState {
  balance: number;
  transactions: Transaction[];
  passes: OwnedPass[];
  budgets: Budgets;
  creatorPricing: CreatorPricingOverrides;
  apiKeys: ApiKey[];
  /** Transient — never persisted. */
  run: RunState | null;
  modelRun: ModelRunState | null;
  topUpOpen: boolean;
  _hasHydrated: boolean;
  _seeded: boolean;

  setHasHydrated: (v: boolean) => void;
  seedIfEmpty: () => void;
  startRun: (agentId: string, taskPrompt: string) => void;
  approveRun: (opts?: { overrideBudget?: boolean }) => void;
  cancelRun: () => void;
  purchasePass: (
    agentId: string,
    type: PassType,
  ) => { ok: boolean; reason?: "insufficient" | "unavailable" };
  /** Pays a pass directly from a Stellar wallet — bypasses the prepaid balance entirely. */
  purchasePassWithStellar: (
    agentId: string,
    type: PassType,
    txHash: string,
    amountXlm: number,
  ) => { ok: boolean; reason?: "unavailable" };
  /** Pays a pass via QRIS through the Midtrans sandbox — settlement checked server-side. */
  purchasePassWithQris: (
    agentId: string,
    type: PassType,
    orderId: string,
  ) => { ok: boolean; reason?: "unavailable" };
  startModelCall: (modelId: string, taskPrompt: string) => void;
  approveModelCall: (opts?: { overrideBudget?: boolean }) => void;
  cancelModelCall: () => void;
  purchaseModelPass: (
    modelId: string,
    type: PassType,
  ) => { ok: boolean; reason?: "insufficient" | "unavailable" };
  purchaseModelPassWithStellar: (
    modelId: string,
    type: PassType,
    txHash: string,
    amountXlm: number,
  ) => { ok: boolean; reason?: "unavailable" };
  purchaseModelPassWithQris: (
    modelId: string,
    type: PassType,
    orderId: string,
  ) => { ok: boolean; reason?: "unavailable" };
  /** Buys a multi-model tier bundle from the prepaid balance. */
  purchaseTierPass: (
    tierSlug: string,
    type: PassType,
  ) => { ok: boolean; reason?: "insufficient" | "unavailable" };
  purchaseTierPassWithStellar: (
    tierSlug: string,
    type: PassType,
    txHash: string,
    amountXlm: number,
  ) => { ok: boolean; reason?: "unavailable" };
  purchaseTierPassWithQris: (
    tierSlug: string,
    type: PassType,
    orderId: string,
  ) => { ok: boolean; reason?: "unavailable" };
  createApiKey: (modelId: string | null, label: string) => ApiKey;
  revokeApiKey: (id: string) => void;
  topUp: (amount: number) => void;
  topUpWithStellar: (amountUsd: number, amountXlm: number, txHash: string) => void;
  topUpWithQris: (amountUsd: number, orderId: string) => void;
  setTopUpOpen: (open: boolean) => void;
  setBudget: (window: BudgetWindow, cap: number | null) => void;
  setCreatorPricing: (agentId: string, model: BillingModel, enabled: boolean) => void;
  resetDemo: () => void;
}

let runTimer: ReturnType<typeof setTimeout> | null = null;
let modelRunTimer: ReturnType<typeof setTimeout> | null = null;
let modelCallAbort: AbortController | null = null;
let runTokenCounter = 0;

function clearRunTimer() {
  if (runTimer) {
    clearTimeout(runTimer);
    runTimer = null;
  }
}

function clearModelRunTimer() {
  if (modelRunTimer) {
    clearTimeout(modelRunTimer);
    modelRunTimer = null;
  }
}

function abortModelCall() {
  if (modelCallAbort) {
    modelCallAbort.abort();
    modelCallAbort = null;
  }
}

interface LiveCallResponse {
  text: string;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
  liveModelId: string;
}

/** POSTs the prompt to the live-call route; rejects with the API's error code. */
async function requestLiveCall(
  modelId: string,
  prompt: string,
  signal: AbortSignal,
): Promise<LiveCallResponse> {
  const res = await fetch("/api/model-call", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ modelId, prompt }),
    signal,
  });
  const data = (await res.json()) as Partial<LiveCallResponse> & { error?: string };
  if (!res.ok || typeof data.text !== "string") {
    throw new Error(data.error ?? "upstream_error");
  }
  return data as LiveCallResponse;
}

/** Shared by agent and model approval flows. */
function findBudgetWarning(
  budgets: Budgets,
  transactions: Transaction[],
  cap: number,
  now: number,
): BudgetWarning | undefined {
  let tightest: BudgetWarning | undefined;
  for (const window of ["daily", "weekly", "monthly"] as BudgetWindow[]) {
    const windowCap = budgets[window];
    if (windowCap == null) continue;
    const remaining = round4(windowCap - spentSince(transactions, budgetWindowStart(window, now)));
    if (cap > remaining && (!tightest || remaining < tightest.remaining)) {
      tightest = { window, cap: windowCap, remaining };
    }
  }
  return tightest;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      balance: 0,
      transactions: [],
      passes: [],
      budgets: { daily: null, weekly: null, monthly: null },
      creatorPricing: {},
      apiKeys: [],
      run: null,
      modelRun: null,
      topUpOpen: false,
      _hasHydrated: false,
      _seeded: false,

      setHasHydrated: (v) => set({ _hasHydrated: v }),

      seedIfEmpty: () => {
        if (get()._seeded) return;
        set({ ...buildSeedState(Date.now()), _seeded: true });
      },

      startRun: (agentId, taskPrompt) => {
        const agent = getAgentById(agentId);
        const pricing = agent
          ? getEffectivePricing(agent, get().creatorPricing).perRequest
          : undefined;
        if (!agent || !pricing) return;

        clearRunTimer();
        const token = ++runTokenCounter;
        set({
          run: {
            phase: "estimating",
            runToken: token,
            agentId,
            taskPrompt,
            estimate: pricing,
            executionMs: rollExecutionMs(agent.avgExecutionMs),
            coveredByPass: getActivePass(get().passes, agentId, Date.now()),
          },
        });
        runTimer = setTimeout(() => {
          const { run } = get();
          if (run?.runToken === token && run.phase === "estimating") {
            set({ run: { ...run, phase: "review" } });
          }
        }, 550 + Math.random() * 500);
      },

      approveRun: (opts) => {
        const { run, budgets, transactions, balance } = get();
        if (!run || (run.phase !== "review" && run.phase !== "confirm_budget")) return;

        if (!run.coveredByPass) {
          if (balance < run.estimate.cap) return; // UI disables; guard anyway

          if (!opts?.overrideBudget) {
            const tightest = findBudgetWarning(budgets, transactions, run.estimate.cap, Date.now());
            if (tightest) {
              set({ run: { ...run, phase: "confirm_budget", budgetWarning: tightest } });
              return;
            }
          }
        }

        const token = run.runToken;
        set({ run: { ...run, phase: "running", budgetWarning: undefined } });
        clearRunTimer();
        runTimer = setTimeout(() => {
          const state = get();
          const current = state.run;
          if (!current || current.runToken !== token || current.phase !== "running") return;

          const agent = getAgentById(current.agentId);
          if (!agent) return;

          const rolled = rollActualCost(current.estimate);
          const covered = Boolean(current.coveredByPass);
          const amount = covered ? 0 : rolled.amount;
          const receipt: Transaction = {
            id: makeId("txn"),
            type: "usage",
            createdAt: Date.now(),
            amount,
            agentId: agent.id,
            agentName: agent.name,
            taskPrompt: current.taskPrompt,
            breakdown: buildBreakdown(agent.providersUsed, rolled.amount),
            executionMs: current.executionMs,
            estimate: current.estimate,
            cappedOverrun: !covered && rolled.cappedOverrun,
            ...(current.coveredByPass
              ? {
                  coveredByPassId: current.coveredByPass.id,
                  coveredByPassType: current.coveredByPass.type,
                }
              : {}),
          };

          set({
            balance: round4(state.balance - amount),
            transactions: [receipt, ...state.transactions],
            run: { ...current, phase: "receipt", receipt },
          });
          toast.success(
            covered
              ? `Run covered by your ${PASS_LABELS[current.coveredByPass!.type]}`
              : `Charged ${formatMoney(amount)} — receipt ready`,
          );
        }, run.executionMs);
      },

      cancelRun: () => {
        clearRunTimer();
        set({ run: null });
      },

      purchasePass: (agentId, type) => {
        const agent = getAgentById(agentId);
        const pricing = agent
          ? getEffectivePricing(agent, get().creatorPricing).passes[type]
          : undefined;
        if (!agent || !pricing) return { ok: false as const, reason: "unavailable" as const };
        if (get().balance < pricing.price) {
          return { ok: false as const, reason: "insufficient" as const };
        }

        const now = Date.now();
        const pass: OwnedPass = {
          id: makeId("pass"),
          agentId,
          type,
          price: pricing.price,
          activatedAt: now,
          expiresAt: now + PASS_DURATIONS_MS[type],
        };
        const txn: Transaction = {
          id: makeId("txn"),
          type: "pass_purchase",
          createdAt: now,
          amount: pricing.price,
          agentId,
          agentName: agent.name,
          passType: type,
        };
        set((s) => ({
          balance: round4(s.balance - pricing.price),
          passes: [pass, ...s.passes],
          transactions: [txn, ...s.transactions],
        }));
        toast.success(`${PASS_LABELS[type]} active for ${agent.name}`);
        return { ok: true as const };
      },

      purchasePassWithStellar: (agentId, type, txHash, amountXlm) => {
        const agent = getAgentById(agentId);
        const pricing = agent
          ? getEffectivePricing(agent, get().creatorPricing).passes[type]
          : undefined;
        if (!agent || !pricing) return { ok: false as const, reason: "unavailable" as const };

        const now = Date.now();
        const pass: OwnedPass = {
          id: makeId("pass"),
          agentId,
          type,
          price: pricing.price,
          activatedAt: now,
          expiresAt: now + PASS_DURATIONS_MS[type],
        };
        const txn: Transaction = {
          id: makeId("txn"),
          type: "pass_purchase",
          createdAt: now,
          amount: pricing.price,
          agentId,
          agentName: agent.name,
          passType: type,
          stellarTxHash: txHash,
          stellarAmountXlm: amountXlm,
        };
        set((s) => ({
          passes: [pass, ...s.passes],
          transactions: [txn, ...s.transactions],
        }));
        toast.success(`${PASS_LABELS[type]} active for ${agent.name}`);
        return { ok: true as const };
      },

      purchasePassWithQris: (agentId, type, orderId) => {
        const agent = getAgentById(agentId);
        const pricing = agent
          ? getEffectivePricing(agent, get().creatorPricing).passes[type]
          : undefined;
        if (!agent || !pricing) return { ok: false as const, reason: "unavailable" as const };

        const now = Date.now();
        const pass: OwnedPass = {
          id: makeId("pass"),
          agentId,
          type,
          price: pricing.price,
          activatedAt: now,
          expiresAt: now + PASS_DURATIONS_MS[type],
        };
        const txn: Transaction = {
          id: makeId("txn"),
          type: "pass_purchase",
          createdAt: now,
          amount: pricing.price,
          agentId,
          agentName: agent.name,
          passType: type,
          midtransOrderId: orderId,
        };
        set((s) => ({
          passes: [pass, ...s.passes],
          transactions: [txn, ...s.transactions],
        }));
        toast.success(`${PASS_LABELS[type]} active for ${agent.name}`);
        return { ok: true as const };
      },

      startModelCall: (modelId, taskPrompt) => {
        const model = getModelById(modelId);
        if (!model) return;

        clearModelRunTimer();
        const token = ++runTokenCounter;
        set({
          modelRun: {
            phase: "estimating",
            runToken: token,
            modelId,
            taskPrompt,
            estimate: model.pricing.perRequest,
            executionMs: rollExecutionMs(1800),
            coveredByPass: getModelCoverage(get().passes, modelId, Date.now()),
          },
        });
        modelRunTimer = setTimeout(() => {
          const { modelRun } = get();
          if (modelRun?.runToken === token && modelRun.phase === "estimating") {
            set({ modelRun: { ...modelRun, phase: "review" } });
          }
        }, 550 + Math.random() * 500);
      },

      approveModelCall: (opts) => {
        const { modelRun, budgets, transactions, balance } = get();
        if (
          !modelRun ||
          (modelRun.phase !== "review" && modelRun.phase !== "confirm_budget")
        )
          return;

        if (!modelRun.coveredByPass) {
          if (balance < modelRun.estimate.cap) return;

          if (!opts?.overrideBudget) {
            const tightest = findBudgetWarning(
              budgets,
              transactions,
              modelRun.estimate.cap,
              Date.now(),
            );
            if (tightest) {
              set({ modelRun: { ...modelRun, phase: "confirm_budget", budgetWarning: tightest } });
              return;
            }
          }
        }

        const model = getModelById(modelRun.modelId);
        if (!model) return;

        const token = modelRun.runToken;
        set({ modelRun: { ...modelRun, phase: "running", budgetWarning: undefined } });
        clearModelRunTimer();
        abortModelCall();

        /** Shared terminal step for the live and simulated branches. */
        const commitReceipt = (result: {
          amountCharged: number;
          breakdown: CostLine[];
          inputTokens: number;
          outputTokens: number;
          executionMs: number;
          cappedOverrun: boolean;
          responseText?: string;
          liveModelId?: string;
          simulatedFallback?: boolean;
        }) => {
          const state = get();
          const current = state.modelRun;
          if (!current || current.runToken !== token || current.phase !== "running") return;

          const covered = Boolean(current.coveredByPass);
          const amount = covered ? 0 : result.amountCharged;
          const receipt: Transaction = {
            id: makeId("txn"),
            type: "model_usage",
            createdAt: Date.now(),
            amount,
            modelId: model.id,
            modelName: model.name,
            taskPrompt: current.taskPrompt,
            breakdown: result.breakdown,
            inputTokens: result.inputTokens,
            outputTokens: result.outputTokens,
            executionMs: result.executionMs,
            estimate: current.estimate,
            cappedOverrun: !covered && result.cappedOverrun,
            ...(result.responseText != null ? { responseText: result.responseText } : {}),
            ...(result.liveModelId != null ? { liveModelId: result.liveModelId } : {}),
            ...(result.simulatedFallback ? { simulatedFallback: true } : {}),
            ...(current.coveredByPass
              ? {
                  coveredByPassId: current.coveredByPass.id,
                  coveredByPassType: current.coveredByPass.type,
                }
              : {}),
          };

          // Tier passes meter against a shared token budget; direct model
          // passes stay unlimited for the whole window.
          const coveringTierId = current.coveredByPass?.tierId;
          const passes = coveringTierId
            ? state.passes.map((p) =>
                p.id === current.coveredByPass!.id
                  ? {
                      ...p,
                      tokensUsed:
                        (p.tokensUsed ?? 0) + result.inputTokens + result.outputTokens,
                    }
                  : p,
              )
            : state.passes;

          set({
            balance: round4(state.balance - amount),
            transactions: [receipt, ...state.transactions],
            modelRun: { ...current, phase: "receipt", receipt },
            passes,
          });
          toast.success(
            covered
              ? `Call covered by your ${PASS_LABELS[current.coveredByPass!.type]}`
              : `Charged ${formatMoney(amount)} — receipt ready`,
          );
        };

        const simulatedResult = () => {
          const rolled = rollActualCost(modelRun.estimate);
          const sim = buildTokenBreakdown(model.pricing.rateCard, rolled.amount);
          return {
            amountCharged: rolled.amount,
            breakdown: sim.breakdown,
            inputTokens: sim.inputTokens,
            outputTokens: sim.outputTokens,
            executionMs: modelRun.executionMs,
            cappedOverrun: rolled.cappedOverrun,
          };
        };

        if (model.liveModelId) {
          // Real call through OpenRouter; the pre-rolled executionMs doubles as a
          // minimum display time so the progress indicator never flashes.
          const controller = new AbortController();
          modelCallAbort = controller;
          const startedAt = Date.now();
          const request = requestLiveCall(model.id, modelRun.taskPrompt, controller.signal);
          const minDelay = new Promise<void>((resolve) =>
            setTimeout(resolve, modelRun.executionMs),
          );
          void Promise.allSettled([request, minDelay]).then(([outcome]) => {
            if (modelCallAbort === controller) modelCallAbort = null;
            if (controller.signal.aborted) return;

            if (outcome.status === "fulfilled") {
              const live = outcome.value;
              const usage = buildRealTokenBreakdown(
                model.pricing.rateCard,
                live.inputTokens,
                live.outputTokens,
              );
              commitReceipt({
                amountCharged: Math.min(usage.total, modelRun.estimate.cap),
                breakdown: usage.breakdown,
                inputTokens: live.inputTokens,
                outputTokens: live.outputTokens,
                executionMs: Date.now() - startedAt,
                cappedOverrun: usage.total > modelRun.estimate.cap,
                responseText: live.text,
                liveModelId: live.liveModelId,
              });
            } else {
              const reason =
                outcome.reason instanceof Error ? outcome.reason.message : "upstream_error";
              toast.info(
                reason === "rate_limited"
                  ? "Free-tier rate limit reached — showing a simulated receipt"
                  : "Live call unavailable — showing a simulated receipt",
              );
              commitReceipt({
                ...simulatedResult(),
                liveModelId: model.liveModelId,
                simulatedFallback: true,
              });
            }
          });
          return;
        }

        modelRunTimer = setTimeout(() => {
          commitReceipt(simulatedResult());
        }, modelRun.executionMs);
      },

      cancelModelCall: () => {
        clearModelRunTimer();
        abortModelCall();
        set({ modelRun: null });
      },

      purchaseModelPass: (modelId, type) => {
        const model = getModelById(modelId);
        const pricing = model?.pricing.passes[type];
        if (!model || !pricing) return { ok: false as const, reason: "unavailable" as const };
        if (get().balance < pricing.price) {
          return { ok: false as const, reason: "insufficient" as const };
        }

        const now = Date.now();
        const pass: OwnedPass = {
          id: makeId("pass"),
          modelId,
          type,
          price: pricing.price,
          activatedAt: now,
          expiresAt: now + PASS_DURATIONS_MS[type],
        };
        const txn: Transaction = {
          id: makeId("txn"),
          type: "pass_purchase",
          createdAt: now,
          amount: pricing.price,
          modelId,
          modelName: model.name,
          passType: type,
        };
        set((s) => ({
          balance: round4(s.balance - pricing.price),
          passes: [pass, ...s.passes],
          transactions: [txn, ...s.transactions],
        }));
        toast.success(`${PASS_LABELS[type]} active for ${model.name}`);
        return { ok: true as const };
      },

      purchaseModelPassWithStellar: (modelId, type, txHash, amountXlm) => {
        const model = getModelById(modelId);
        const pricing = model?.pricing.passes[type];
        if (!model || !pricing) return { ok: false as const, reason: "unavailable" as const };

        const now = Date.now();
        const pass: OwnedPass = {
          id: makeId("pass"),
          modelId,
          type,
          price: pricing.price,
          activatedAt: now,
          expiresAt: now + PASS_DURATIONS_MS[type],
        };
        const txn: Transaction = {
          id: makeId("txn"),
          type: "pass_purchase",
          createdAt: now,
          amount: pricing.price,
          modelId,
          modelName: model.name,
          passType: type,
          stellarTxHash: txHash,
          stellarAmountXlm: amountXlm,
        };
        set((s) => ({
          passes: [pass, ...s.passes],
          transactions: [txn, ...s.transactions],
        }));
        toast.success(`${PASS_LABELS[type]} active for ${model.name}`);
        return { ok: true as const };
      },

      purchaseModelPassWithQris: (modelId, type, orderId) => {
        const model = getModelById(modelId);
        const pricing = model?.pricing.passes[type];
        if (!model || !pricing) return { ok: false as const, reason: "unavailable" as const };

        const now = Date.now();
        const pass: OwnedPass = {
          id: makeId("pass"),
          modelId,
          type,
          price: pricing.price,
          activatedAt: now,
          expiresAt: now + PASS_DURATIONS_MS[type],
        };
        const txn: Transaction = {
          id: makeId("txn"),
          type: "pass_purchase",
          createdAt: now,
          amount: pricing.price,
          modelId,
          modelName: model.name,
          passType: type,
          midtransOrderId: orderId,
        };
        set((s) => ({
          passes: [pass, ...s.passes],
          transactions: [txn, ...s.transactions],
        }));
        toast.success(`${PASS_LABELS[type]} active for ${model.name}`);
        return { ok: true as const };
      },

      purchaseTierPass: (tierSlug, type) => {
        const tier = getTier(tierSlug);
        const pricing = tier?.passes[type];
        if (!tier || !pricing) return { ok: false as const, reason: "unavailable" as const };
        if (get().balance < pricing.price) {
          return { ok: false as const, reason: "insufficient" as const };
        }

        const now = Date.now();
        const modelIds = tierModels(tier).map((m) => m.id);
        const pass: OwnedPass = {
          id: makeId("pass"),
          tierId: tier.id,
          tierName: tier.name,
          modelIds,
          tokenLimit: tier.tokenLimit,
          tokensUsed: 0,
          type,
          price: pricing.price,
          activatedAt: now,
          expiresAt: now + PASS_DURATIONS_MS[type],
        };
        const txn: Transaction = {
          id: makeId("txn"),
          type: "pass_purchase",
          createdAt: now,
          amount: pricing.price,
          tierId: tier.id,
          tierName: tier.name,
          passType: type,
        };
        set((s) => ({
          balance: round4(s.balance - pricing.price),
          passes: [pass, ...s.passes],
          transactions: [txn, ...s.transactions],
        }));
        toast.success(`${PASS_LABELS[type]} active for the ${tier.name} tier`);
        return { ok: true as const };
      },

      purchaseTierPassWithStellar: (tierSlug, type, txHash, amountXlm) => {
        const tier = getTier(tierSlug);
        const pricing = tier?.passes[type];
        if (!tier || !pricing) return { ok: false as const, reason: "unavailable" as const };

        const now = Date.now();
        const modelIds = tierModels(tier).map((m) => m.id);
        const pass: OwnedPass = {
          id: makeId("pass"),
          tierId: tier.id,
          tierName: tier.name,
          modelIds,
          tokenLimit: tier.tokenLimit,
          tokensUsed: 0,
          type,
          price: pricing.price,
          activatedAt: now,
          expiresAt: now + PASS_DURATIONS_MS[type],
        };
        const txn: Transaction = {
          id: makeId("txn"),
          type: "pass_purchase",
          createdAt: now,
          amount: pricing.price,
          tierId: tier.id,
          tierName: tier.name,
          passType: type,
          stellarTxHash: txHash,
          stellarAmountXlm: amountXlm,
        };
        set((s) => ({
          passes: [pass, ...s.passes],
          transactions: [txn, ...s.transactions],
        }));
        toast.success(`${PASS_LABELS[type]} active for the ${tier.name} tier`);
        return { ok: true as const };
      },

      purchaseTierPassWithQris: (tierSlug, type, orderId) => {
        const tier = getTier(tierSlug);
        const pricing = tier?.passes[type];
        if (!tier || !pricing) return { ok: false as const, reason: "unavailable" as const };

        const now = Date.now();
        const modelIds = tierModels(tier).map((m) => m.id);
        const pass: OwnedPass = {
          id: makeId("pass"),
          tierId: tier.id,
          tierName: tier.name,
          modelIds,
          tokenLimit: tier.tokenLimit,
          tokensUsed: 0,
          type,
          price: pricing.price,
          activatedAt: now,
          expiresAt: now + PASS_DURATIONS_MS[type],
        };
        const txn: Transaction = {
          id: makeId("txn"),
          type: "pass_purchase",
          createdAt: now,
          amount: pricing.price,
          tierId: tier.id,
          tierName: tier.name,
          passType: type,
          midtransOrderId: orderId,
        };
        set((s) => ({
          passes: [pass, ...s.passes],
          transactions: [txn, ...s.transactions],
        }));
        toast.success(`${PASS_LABELS[type]} active for the ${tier.name} tier`);
        return { ok: true as const };
      },

      createApiKey: (modelId, label) => {
        const secret = generateApiKeySecret();
        const key: ApiKey = {
          id: makeId("key"),
          label: label.trim() || "Untitled key",
          modelId,
          secret,
          last4: secret.slice(-4),
          createdAt: Date.now(),
          lastUsedAt: null,
          revokedAt: null,
        };
        set((s) => ({ apiKeys: [key, ...s.apiKeys] }));
        return key;
      },

      revokeApiKey: (id) => {
        set((s) => ({
          apiKeys: s.apiKeys.map((k) => (k.id === id ? { ...k, revokedAt: Date.now() } : k)),
        }));
        toast.success("API key revoked");
      },

      topUp: (amount) => {
        if (!Number.isFinite(amount) || amount <= 0) return;
        const txn: Transaction = {
          id: makeId("txn"),
          type: "top_up",
          createdAt: Date.now(),
          amount: round4(amount),
        };
        set((s) => ({
          balance: round4(s.balance + amount),
          transactions: [txn, ...s.transactions],
        }));
        toast.success(`Added ${formatMoneyExact(amount)} to your wallet`);
      },

      topUpWithStellar: (amountUsd, amountXlm, txHash) => {
        const txn: Transaction = {
          id: makeId("txn"),
          type: "top_up",
          createdAt: Date.now(),
          amount: round4(amountUsd),
          stellarTxHash: txHash,
          stellarAmountXlm: amountXlm,
        };
        set((s) => ({
          balance: round4(s.balance + amountUsd),
          transactions: [txn, ...s.transactions],
        }));
        toast.success(`Added ${formatMoneyExact(amountUsd)} via ${amountXlm} XLM (testnet)`);
      },

      topUpWithQris: (amountUsd, orderId) => {
        if (!Number.isFinite(amountUsd) || amountUsd <= 0) return;
        const txn: Transaction = {
          id: makeId("txn"),
          type: "top_up",
          createdAt: Date.now(),
          amount: round4(amountUsd),
          midtransOrderId: orderId,
        };
        set((s) => ({
          balance: round4(s.balance + amountUsd),
          transactions: [txn, ...s.transactions],
        }));
        toast.success(`Added ${formatMoneyExact(amountUsd)} via QRIS (sandbox)`);
      },

      setTopUpOpen: (open) => set({ topUpOpen: open }),

      setBudget: (window, cap) => {
        set((s) => ({ budgets: { ...s.budgets, [window]: cap } }));
        toast.success(
          cap == null
            ? `${BUDGET_WINDOW_LABELS[window]} budget removed`
            : `${BUDGET_WINDOW_LABELS[window]} budget set to ${formatMoneyExact(cap)}`,
        );
      },

      setCreatorPricing: (agentId, model, enabled) => {
        set((s) => ({
          creatorPricing: {
            ...s.creatorPricing,
            [agentId]: { ...s.creatorPricing[agentId], [model]: enabled },
          },
        }));
      },

      resetDemo: () => {
        clearRunTimer();
        clearModelRunTimer();
        abortModelCall();
        set({
          ...buildSeedState(Date.now()),
          creatorPricing: {},
          run: null,
          modelRun: null,
          topUpOpen: false,
          _seeded: true,
        });
        toast.success("Demo data reset");
      },
    }),
    {
      name: "jatah:v1",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        balance: s.balance,
        transactions: s.transactions,
        passes: s.passes,
        budgets: s.budgets,
        creatorPricing: s.creatorPricing,
        apiKeys: s.apiKeys,
        _seeded: s._seeded,
      }),
      skipHydration: true,
    },
  ),
);

/** Gate any store-driven UI behind this to keep server and first client paint identical. */
export function useHydrated(): boolean {
  return useAppStore((s) => s._hasHydrated);
}
