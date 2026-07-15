"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { toast } from "sonner";
import {
  buildBreakdown,
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
import { buildSeedState } from "@/lib/data/seed";
import type {
  BillingModel,
  BudgetWindow,
  Budgets,
  OwnedPass,
  PassType,
  PerRequestPricing,
  Transaction,
} from "@/lib/types";
import { getActivePass, getEffectivePricing, spentSince } from "@/lib/store/selectors";

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
  /** Transient — never persisted. */
  run: RunState | null;
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
  topUp: (amount: number) => void;
  setTopUpOpen: (open: boolean) => void;
  setBudget: (window: BudgetWindow, cap: number | null) => void;
  setCreatorPricing: (agentId: string, model: BillingModel, enabled: boolean) => void;
  resetDemo: () => void;
}

let runTimer: ReturnType<typeof setTimeout> | null = null;
let runTokenCounter = 0;

function clearRunTimer() {
  if (runTimer) {
    clearTimeout(runTimer);
    runTimer = null;
  }
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      balance: 0,
      transactions: [],
      passes: [],
      budgets: { daily: null, weekly: null, monthly: null },
      creatorPricing: {},
      run: null,
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
            const now = Date.now();
            let tightest: BudgetWarning | undefined;
            for (const window of ["daily", "weekly", "monthly"] as BudgetWindow[]) {
              const cap = budgets[window];
              if (cap == null) continue;
              const remaining = round4(cap - spentSince(transactions, budgetWindowStart(window, now)));
              if (run.estimate.cap > remaining) {
                if (!tightest || remaining < tightest.remaining) {
                  tightest = { window, cap, remaining };
                }
              }
            }
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
        set({
          ...buildSeedState(Date.now()),
          creatorPricing: {},
          run: null,
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
