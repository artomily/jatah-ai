"use client";

import { useState } from "react";
import { ArrowDownLeft, Bot, Cpu, ExternalLink, ReceiptText, Ticket } from "lucide-react";
import { PASS_LABELS, formatCredit, formatMoney, formatTime } from "@/lib/format";
import { stellarExplorerTxUrl } from "@/lib/stellar/config";
import type { Transaction } from "@/lib/types";
import { ReceiptCard } from "@/components/billing/receipt-card";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

function Icon({ txn }: { txn: Transaction }) {
  if (txn.type === "top_up") return <ArrowDownLeft className="size-4" aria-hidden />;
  if (txn.type === "pass_purchase") return <Ticket className="size-4" aria-hidden />;
  if (txn.type === "model_usage") return <Cpu className="size-4" aria-hidden />;
  return <Bot className="size-4" aria-hidden />;
}

function title(txn: Transaction): string {
  if (txn.type === "top_up") {
    if (txn.stellarTxHash) return "Wallet top-up · Stellar";
    if (txn.midtransOrderId) return "Wallet top-up · QRIS";
    return "Wallet top-up";
  }
  if (txn.type === "pass_purchase") {
    const name = txn.agentName ?? txn.modelName ?? "";
    return `${txn.passType ? PASS_LABELS[txn.passType] : "Pass"} · ${name}`;
  }
  if (txn.type === "model_usage") return txn.modelName ?? "Model call";
  return txn.agentName ?? "Agent run";
}

export function TransactionRow({ txn }: { txn: Transaction }) {
  const [open, setOpen] = useState(false);
  const canOpenReceipt =
    (txn.type === "usage" || txn.type === "model_usage") && Boolean(txn.breakdown);

  const row = (
    <div className="flex items-center gap-3 px-1 py-2.5">
      <span
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-lg",
          txn.type === "top_up"
            ? "bg-success-soft text-success"
            : "bg-muted text-muted-foreground",
        )}
        aria-hidden
      >
        <Icon txn={txn} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{title(txn)}</p>
        {txn.taskPrompt && (
          <p className="truncate text-xs text-muted-foreground">{txn.taskPrompt}</p>
        )}
        {txn.stellarTxHash && (
          <a
            href={stellarExplorerTxUrl(txn.stellarTxHash)}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-0.5 text-xs text-muted-foreground hover:underline"
          >
            {txn.stellarAmountXlm} XLM <ExternalLink className="size-2.5" aria-hidden />
          </a>
        )}
        {txn.midtransOrderId && (
          <p className="truncate text-xs text-muted-foreground">
            QRIS sandbox · {txn.midtransOrderId}
          </p>
        )}
      </div>
      <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
        {formatTime(txn.createdAt)}
      </span>
      <span
        className={cn(
          "w-20 shrink-0 text-right text-sm font-medium tabular-nums",
          txn.type === "top_up" && "text-success",
        )}
      >
        {txn.type === "top_up" ? formatCredit(txn.amount) : formatMoney(txn.amount)}
      </span>
    </div>
  );

  if (!canOpenReceipt) return row;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-lg text-left transition-colors outline-none hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="flex items-center gap-1">
          {row}
          <ReceiptText
            className="mr-1 size-3.5 shrink-0 text-muted-foreground/60"
            aria-hidden
          />
        </span>
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogTitle className="sr-only">Receipt for {title(txn)}</DialogTitle>
          <ReceiptCard txn={txn} />
        </DialogContent>
      </Dialog>
    </>
  );
}
