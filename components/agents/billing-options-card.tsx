"use client";

import { useState } from "react";
import { Ticket } from "lucide-react";
import { PASS_LABELS, formatMoney, formatMoneyExact, formatRange } from "@/lib/format";
import { useAppStore, useHydrated } from "@/lib/store/app-store";
import { useEffectivePricing } from "@/lib/store/hooks";
import { getActivePass } from "@/lib/store/selectors";
import { useNow } from "@/hooks/use-now";
import type { Agent, PassType } from "@/lib/types";
import { PassCountdown } from "@/components/billing/pass-countdown";
import { PassPurchaseDialog } from "@/components/billing/pass-purchase-dialog";
import { RunAgentModal } from "@/components/billing/run-agent-modal";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

export function BillingOptionsCard({ agent }: { agent: Agent }) {
  const hydrated = useHydrated();
  const passes = useAppStore((s) => s.passes);
  const startRun = useAppStore((s) => s.startRun);
  const pricing = useEffectivePricing(agent);
  const [prompt, setPrompt] = useState("");
  const [runOpen, setRunOpen] = useState(false);
  const [passOpen, setPassOpen] = useState(false);

  const now = useNow();
  const activePass =
    hydrated && now != null ? getActivePass(passes, agent.id, now) : undefined;
  const passEntries = Object.entries(pricing.passes) as Array<
    [PassType, { price: number }]
  >;

  const handleRun = () => {
    if (!pricing.perRequest) return;
    startRun(agent.id, prompt.trim() || "Untitled task");
    setRunOpen(true);
  };

  return (
    <div className="flex flex-col gap-4 rounded-xl border bg-card p-5 shadow-card">
      <div>
        <h2 className="font-semibold tracking-tight">How billing works here</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {agent.name} shows its cost before every run and covers you with a hard cap —
          or run free under an active time pass.
        </p>
      </div>

      {!hydrated ? (
        <Skeleton className="h-24 w-full" />
      ) : activePass ? (
        <div className="flex items-center gap-2 rounded-lg bg-success-soft px-3 py-2 text-sm text-success">
          <Ticket className="size-4 shrink-0" aria-hidden />
          <span>
            Covered by your {PASS_LABELS[activePass.type]} —{" "}
            <PassCountdown expiresAt={activePass.expiresAt} /> left
          </span>
        </div>
      ) : null}

      {pricing.perRequest && (
        <div className="flex items-center justify-between rounded-lg border px-3.5 py-2.5 text-sm">
          <span className="text-muted-foreground">Pay per request</span>
          <span className="font-medium tabular-nums">
            {formatRange(pricing.perRequest.estMin, pricing.perRequest.estMax)}{" "}
            <span className="text-muted-foreground">
              (cap {formatMoney(pricing.perRequest.cap)})
            </span>
          </span>
        </div>
      )}

      {passEntries.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {passEntries.map(([type, { price }]) => (
            <li
              key={type}
              className="flex items-center justify-between rounded-lg border px-3.5 py-2.5 text-sm"
            >
              <span className="text-muted-foreground">{PASS_LABELS[type]}</span>
              <span className="font-medium tabular-nums">{formatMoneyExact(price)}</span>
            </li>
          ))}
        </ul>
      )}

      {pricing.perRequest && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="task-prompt">Task</Label>
          <Textarea
            id="task-prompt"
            placeholder={`What should ${agent.name} do?`}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
          />
        </div>
      )}

      <div className="flex flex-col gap-2">
        {pricing.perRequest && (
          <Button onClick={handleRun}>
            {activePass ? "Run agent (covered by pass)" : "Run agent"}
          </Button>
        )}
        {passEntries.length > 0 && (
          <Button variant="outline" onClick={() => setPassOpen(true)}>
            Buy a pass
          </Button>
        )}
        {!pricing.perRequest && passEntries.length === 0 && (
          <p className="text-sm text-muted-foreground">
            This creator hasn&apos;t enabled any billing models yet.
          </p>
        )}
      </div>

      <RunAgentModal agent={agent} open={runOpen} onOpenChange={setRunOpen} />
      {passEntries.length > 0 && (
        <PassPurchaseDialog agent={agent} open={passOpen} onOpenChange={setPassOpen} />
      )}
    </div>
  );
}
