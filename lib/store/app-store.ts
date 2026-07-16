"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { toast } from "sonner";
import {
  buildBreakdown,
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
import { buildSeedState } from "@/lib/data/seed";
import type {
  ApiKey,
  BillingModel,
  BudgetWindow,
  Budgets,
  OwnedPass,
  PassType,
  PerRequestPricing,
  Transaction,
} from "@/lib/types";
import {
  getActiveModelPass,
  getActivePass,
  getEffectivePricing,
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
  createApiKey: (modelId: string | null, label: string) => ApiKey;
  revokeApiKey: (id: string) => void;
  topUp: (amount: number) => void;
  topUpWithStellar: (amountUsd: number, amountXlm: number, txHash: string) => void;
  setTopUpOpen: (open: boolean) => void;
  setBudget: (window: BudgetWindow, cap: number | null) => void;
  setCreatorPricing: (agentId: string, model: BillingModel, enabled: boolean) => void;
  resetDemo: () => void;
}

let runTimer: ReturnType<typeof setTimeout> | null = null;
let modelRunTimer: ReturnType<typeof setTimeout> | null = null;
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
            coveredByPass: getActiveModelPass(get().passes, modelId, Date.now()),
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

        const token = modelRun.runToken;
        set({ modelRun: { ...modelRun, phase: "running", budgetWarning: undefined } });
        clearModelRunTimer();
        modelRunTimer = setTimeout(() => {
          const state = get();
          const current = state.modelRun;
          if (!current || current.runToken !== token || current.phase !== "running") return;

          const model = getModelById(current.modelId);
          if (!model) return;

          const rolled = rollActualCost(current.estimate);
          const covered = Boolean(current.coveredByPass);
          const amount = covered ? 0 : rolled.amount;
          const { breakdown, inputTokens, outputTokens } = buildTokenBreakdown(
            model.pricing.rateCard,
            rolled.amount,
          );
          const receipt: Transaction = {
            id: makeId("txn"),
            type: "model_usage",
            createdAt: Date.now(),
            amount,
            modelId: model.id,
            modelName: model.name,
            taskPrompt: current.taskPrompt,
            breakdown,
            inputTokens,
            outputTokens,
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
            modelRun: { ...current, phase: "receipt", receipt },
          });
          toast.success(
            covered
              ? `Call covered by your ${PASS_LABELS[current.coveredByPass!.type]}`
              : `Charged ${formatMoney(amount)} — receipt ready`,
          );
        }, modelRun.executionMs);
      },

      cancelModelCall: () => {
        clearModelRunTimer();
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
