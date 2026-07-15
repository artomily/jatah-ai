"use client";

import { Check, LoaderCircle } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { formatMoney } from "@/lib/format";
import { useAppStore, useHydrated } from "@/lib/store/app-store";
import type { Agent } from "@/lib/types";
import { CostEstimateCard } from "@/components/billing/cost-estimate-card";
import { ReceiptCard } from "@/components/billing/receipt-card";
import { BudgetWarningCard } from "@/components/billing/budget-warning";
import { RunningIndicator } from "@/components/billing/running-indicator";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

const PHASE_TITLE: Record<string, string> = {
  estimating: "Estimating cost…",
  review: "Approve this run",
  confirm_budget: "This run may exceed your budget",
  running: "Running",
  receipt: "Receipt",
};

export function RunAgentModal({
  agent,
  open,
  onOpenChange,
}: {
  agent: Agent;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const hydrated = useHydrated();
  const run = useAppStore((s) => s.run);
  const balance = useAppStore((s) => s.balance);
  const approveRun = useAppStore((s) => s.approveRun);
  const cancelRun = useAppStore((s) => s.cancelRun);
  const setTopUpOpen = useAppStore((s) => s.setTopUpOpen);
  const reducedMotion = useReducedMotion();

  const active = run && run.agentId === agent.id ? run : null;

  const handleClose = (next: boolean) => {
    if (!next && active) cancelRun();
    onOpenChange(next);
  };

  const canAfford = active ? balance >= active.estimate.cap : false;

  const variants = reducedMotion
    ? { initial: {}, animate: {}, exit: {} }
    : {
        initial: { opacity: 0, y: 6 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -6 },
      };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{active ? PHASE_TITLE[active.phase] : "Run agent"}</DialogTitle>
          <DialogDescription>
            {active?.phase === "receipt"
              ? `${agent.name} finished — here's exactly what it cost.`
              : `${agent.name} · "${active?.taskPrompt ?? ""}"`}
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait" initial={false}>
          {!hydrated || !active ? (
            <Skeleton key="skeleton" className="h-40 w-full" />
          ) : (
            <motion.div
              key={active.phase}
              initial={variants.initial}
              animate={variants.animate}
              exit={variants.exit}
              transition={{ duration: 0.18, ease: "easeOut" }}
            >
              {active.phase === "estimating" ? (
                <div className="flex flex-col items-center gap-3 py-8 text-center text-sm text-muted-foreground">
                  <LoaderCircle className="size-5 animate-spin text-brand" aria-hidden />
                  Pricing this task against {agent.name}&apos;s billing model…
                </div>
              ) : active.phase === "review" ? (
                <div className="flex flex-col gap-4">
                  <CostEstimateCard
                    estimate={active.estimate}
                    executionMsHint={active.executionMs}
                    coveredByPassType={active.coveredByPass?.type}
                    balanceAfterWorstCase={
                      active.coveredByPass ? undefined : balance - active.estimate.cap
                    }
                  />
                  {!active.coveredByPass && !canAfford && (
                    <p className="text-xs text-warning">
                      Balance {formatMoney(balance)} is below the{" "}
                      {formatMoney(active.estimate.cap)} maximum charge. Top up to continue.
                    </p>
                  )}
                </div>
              ) : active.phase === "confirm_budget" ? (
                <div className="flex flex-col gap-4">
                  {active.budgetWarning && <BudgetWarningCard warning={active.budgetWarning} />}
                  <CostEstimateCard
                    estimate={active.estimate}
                    executionMsHint={active.executionMs}
                    balanceAfterWorstCase={balance - active.estimate.cap}
                  />
                </div>
              ) : active.phase === "running" ? (
                <RunningIndicator
                  providers={agent.providersUsed}
                  executionMs={active.executionMs}
                />
              ) : (
                active.receipt && (
                  <div className="flex flex-col gap-3">
                    <ReceiptCard txn={active.receipt} />
                    <p className="flex items-center gap-1.5 text-xs text-success">
                      <Check className="size-3.5" aria-hidden />
                      New balance: {formatMoney(balance)}
                    </p>
                  </div>
                )
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <DialogFooter>
          {!active ? null : active.phase === "estimating" || active.phase === "running" ? null : active.phase ===
            "review" ? (
            <>
              <Button variant="outline" onClick={cancelRun}>
                Cancel
              </Button>
              {active.coveredByPass || canAfford ? (
                <Button onClick={() => approveRun()}>Approve &amp; run</Button>
              ) : (
                <Button
                  onClick={() => {
                    handleClose(false);
                    setTopUpOpen(true);
                  }}
                >
                  Top up wallet
                </Button>
              )}
            </>
          ) : active.phase === "confirm_budget" ? (
            <>
              <Button variant="outline" onClick={cancelRun}>
                Cancel
              </Button>
              <Button
                variant="secondary"
                className="bg-warning-soft text-warning hover:bg-warning-soft/80"
                onClick={() => approveRun({ overrideBudget: true })}
              >
                Run anyway
              </Button>
            </>
          ) : (
            <Button onClick={() => handleClose(false)}>Done</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
