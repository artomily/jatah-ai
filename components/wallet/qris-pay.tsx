"use client";

import { useState } from "react";
import { toast } from "sonner";
import { formatMoneyExact } from "@/lib/format";
import { MIDTRANS_SNAP_JS_URL, formatIdr, usdToIdr } from "@/lib/midtrans/config";
import type { PassType } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";

/** What the server should price and tokenize — amounts come from the catalog server-side. */
export type QrisOrderRequest =
  | { purpose: "model_pass"; modelId: string; passType: PassType }
  | { purpose: "agent_pass"; agentId: string; passType: PassType }
  | { purpose: "tier_pass"; tierSlug: string; passType: PassType }
  | { purpose: "top_up"; amountUsd: number };

interface SnapWindow {
  snap?: {
    pay: (
      token: string,
      callbacks: {
        onSuccess: () => void;
        onPending: () => void;
        onError: () => void;
        onClose: () => void;
      },
    ) => void;
  };
}

let snapLoader: Promise<void> | null = null;

/** Injects sandbox snap.js once; resolves when `window.snap` is callable. */
function loadSnapJs(): Promise<void> {
  if ((window as SnapWindow).snap) return Promise.resolve();
  if (!snapLoader) {
    snapLoader = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = MIDTRANS_SNAP_JS_URL;
      script.dataset.clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY ?? "";
      script.onload = () => resolve();
      script.onerror = () => {
        snapLoader = null;
        reject(new Error("Failed to load the Midtrans payment widget"));
      };
      document.body.appendChild(script);
    });
  }
  return snapLoader;
}

const POLL_TRIES = 10;
const POLL_INTERVAL_MS = 2_000;

async function pollSettlement(orderId: string): Promise<boolean> {
  for (let attempt = 0; attempt < POLL_TRIES; attempt++) {
    const res = await fetch(`/api/midtrans/status?orderId=${encodeURIComponent(orderId)}`);
    const data = (await res.json().catch(() => null)) as { ok?: boolean } | null;
    if (data?.ok) return true;
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }
  return false;
}

/**
 * QRIS / e-wallet payment through the Midtrans Snap SANDBOX — the fiat
 * counterpart to `StellarDirectPay`. Grants only after the server confirms
 * settlement via `/api/midtrans/status`; simulate the scan at
 * simulator.sandbox.midtrans.com when testing.
 */
export function QrisPay({
  amountUsd,
  order,
  onPaid,
  onCancel,
}: {
  amountUsd: number;
  order: QrisOrderRequest;
  onPaid: (orderId: string) => void;
  onCancel: () => void;
}) {
  const [step, setStep] = useState<"idle" | "opening" | "waiting" | "verifying">("idle");
  const amountIdr = usdToIdr(amountUsd);

  const pay = async () => {
    setStep("opening");
    try {
      const [, res] = await Promise.all([
        loadSnapJs(),
        fetch("/api/midtrans/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(order),
        }),
      ]);
      const data = (await res.json().catch(() => null)) as {
        token?: string;
        orderId?: string;
        error?: string;
      } | null;
      if (!res.ok || !data?.token || !data.orderId) {
        throw new Error(
          data?.error === "not_configured"
            ? "Midtrans sandbox keys aren't configured yet."
            : "Couldn't start the QRIS payment. Try again in a moment.",
        );
      }
      const { token, orderId } = data;

      const snap = (window as SnapWindow).snap;
      if (!snap) throw new Error("Failed to load the Midtrans payment widget");

      setStep("waiting");
      const finish = async () => {
        setStep("verifying");
        const settled = await pollSettlement(orderId);
        if (settled) {
          toast.success("QRIS payment settled (sandbox)");
          onPaid(orderId);
        } else {
          toast.error("Payment not settled yet — it was not granted. Try again.");
          setStep("idle");
        }
      };
      snap.pay(token, {
        onSuccess: () => void finish(),
        // QRIS often reports pending until the (simulated) scan lands — poll anyway.
        onPending: () => void finish(),
        onError: () => {
          toast.error("QRIS payment failed");
          setStep("idle");
        },
        onClose: () => setStep((s) => (s === "waiting" ? "idle" : s)),
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "QRIS payment failed");
      setStep("idle");
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-muted-foreground">
        Pay with QRIS, GoPay, or ShopeePay through the Midtrans <b>sandbox</b> — a real
        checkout flow with no real money.
      </p>
      <div className="flex items-center justify-between rounded-lg border px-3.5 py-2.5 text-sm">
        <span className="text-muted-foreground">Amount</span>
        <span className="font-medium tabular-nums">
          {formatIdr(amountIdr)}{" "}
          <span className="text-muted-foreground">({formatMoneyExact(amountUsd)})</span>
        </span>
      </div>
      <DialogFooter className="mt-1 px-0">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={pay} disabled={step !== "idle"}>
          {step === "opening"
            ? "Opening checkout…"
            : step === "waiting"
              ? "Waiting for payment…"
              : step === "verifying"
                ? "Confirming settlement…"
                : `Pay ${formatIdr(amountIdr)}`}
        </Button>
      </DialogFooter>
    </div>
  );
}
