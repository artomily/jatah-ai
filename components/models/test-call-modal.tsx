"use client";

import { Check, LoaderCircle } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { formatMoney } from "@/lib/format";
import { useAppStore, useHydrated } from "@/lib/store/app-store";
import type { AiModel } from "@/lib/types";
import { CostEstimateCard } from "@/components/billing/cost-estimate-card";
import { ReceiptCard } from "@/components/billing/receipt-card";
import { BudgetWarningCard } from "@/components/billing/budget-warning";
import { LiveBadge } from "@/components/models/live-badge";
import { ModelCallIndicator } from "@/components/models/model-call-indicator";
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
  review: "Approve this call",
  confirm_budget: "This call may exceed your budget",
  running: "Calling model",
  receipt: "Receipt",
};

export function TestCallModal({
  model,
  open,
  onOpenChange,
}: {
  model: AiModel;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const hydrated = useHydrated();
  const modelRun = useAppStore((s) => s.modelRun);
  const balance = useAppStore((s) => s.balance);
  const approveModelCall = useAppStore((s) => s.approveModelCall);
  const cancelModelCall = useAppStore((s) => s.cancelModelCall);
  const setTopUpOpen = useAppStore((s) => s.setTopUpOpen);
  const reducedMotion = useReducedMotion();

  const active = modelRun && modelRun.modelId === model.id ? modelRun : null;

  const handleClose = (next: boolean) => {
    if (!next && active) cancelModelCall();
    onOpenChange(next);
  };

  const canAfford = active ? balance >= active.estimate.cap : false;

  // Enter-only animation: the div remounts per phase (key), so content swaps
  // instantly and animates in. Exit animations via AnimatePresence mode="wait"
  // deadlocked here (motion v12 + React 19) leaving stale phase content stuck.
  const variants = reducedMotion
    ? { initial: {}, animate: {} }
    : {
        initial: { opacity: 0, y: 6 },
        animate: { opacity: 1, y: 0 },
      };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {active ? PHASE_TITLE[active.phase] : "Test call"}
            <LiveBadge live={Boolean(model.liveModelId)} />
          </DialogTitle>
          <DialogDescription>
            {active?.phase === "receipt"
              ? `${model.name} finished — here's exactly what it cost.`
              : `${model.name} · "${active?.taskPrompt ?? ""}"`}
          </DialogDescription>
        </DialogHeader>

        {!hydrated || !active ? (
          <Skeleton key="skeleton" className="h-40 w-full" />
        ) : (
          <motion.div
            key={active.phase}
            initial={variants.initial}
            animate={variants.animate}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
              {active.phase === "estimating" ? (
                <div className="flex flex-col items-center gap-3 py-8 text-center text-sm text-muted-foreground">
                  <LoaderCircle className="size-5 animate-spin text-brand" aria-hidden />
                  Pricing this call against {model.name}&apos;s rate card…
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
                <ModelCallIndicator
                  executionMs={active.executionMs}
                  live={Boolean(model.liveModelId)}
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

        <DialogFooter>
          {!active ? null : active.phase === "estimating" || active.phase === "running" ? null : active.phase ===
            "review" ? (
            <>
              <Button variant="outline" onClick={cancelModelCall}>
                Cancel
              </Button>
              {active.coveredByPass || canAfford ? (
                <Button onClick={() => approveModelCall()}>Approve &amp; call</Button>
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
              <Button variant="outline" onClick={cancelModelCall}>
                Cancel
              </Button>
              <Button
                variant="secondary"
                className="bg-warning-soft text-warning hover:bg-warning-soft/80"
                onClick={() => approveModelCall({ overrideBudget: true })}
              >
                Call anyway
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
