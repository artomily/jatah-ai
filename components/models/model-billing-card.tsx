"use client";

import { useState } from "react";
import { KeyRound, Ticket } from "lucide-react";
import {
  PASS_LABELS,
  formatMoney,
  formatMoneyExact,
  formatRange,
} from "@/lib/format";
import { useAppStore, useHydrated } from "@/lib/store/app-store";
import { getActiveModelPass } from "@/lib/store/selectors";
import { useNow } from "@/hooks/use-now";
import type { AiModel, PassType } from "@/lib/types";
import { CreateApiKeyDialog } from "@/components/api-keys/create-api-key-dialog";
import { ModelPassPurchaseDialog } from "@/components/models/model-pass-purchase-dialog";
import { PassCountdown } from "@/components/billing/pass-countdown";
import { TestCallModal } from "@/components/models/test-call-modal";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function ModelBillingCard({
  model,
  initialBuyPass,
}: {
  model: AiModel;
  initialBuyPass?: PassType;
}) {
  const hydrated = useHydrated();
  const passes = useAppStore((s) => s.passes);
  const startModelCall = useAppStore((s) => s.startModelCall);
  const [prompt, setPrompt] = useState("");
  const [callOpen, setCallOpen] = useState(false);
  const [passOpen, setPassOpen] = useState(Boolean(initialBuyPass));
  const [keyOpen, setKeyOpen] = useState(false);

  const now = useNow();
  const activePass =
    hydrated && now != null ? getActiveModelPass(passes, model.id, now) : undefined;
  const passEntries = Object.entries(model.pricing.passes) as Array<
    [PassType, { price: number }]
  >;

  const handleTestCall = () => {
    startModelCall(model.id, prompt.trim() || "Test call");
    setCallOpen(true);
  };

  return (
    <div className="flex flex-col gap-4 rounded-xl border bg-card p-5 shadow-card">
      <div>
        <h2 className="font-semibold tracking-tight">How billing works here</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {model.name} shows its cost before every call and covers you with a hard cap —
          or call free under an active time pass.
        </p>
      </div>

      {hydrated && activePass && (
        <div className="flex items-center gap-2 rounded-lg bg-success-soft px-3 py-2 text-sm text-success">
          <Ticket className="size-4 shrink-0" aria-hidden />
          <span>
            Covered by your {PASS_LABELS[activePass.type]} —{" "}
            <PassCountdown expiresAt={activePass.expiresAt} /> left
          </span>
        </div>
      )}

      <div className="flex items-center justify-between rounded-lg border px-3.5 py-2.5 text-sm">
        <span className="text-muted-foreground">Typical request</span>
        <span className="font-medium tabular-nums">
          {formatRange(model.pricing.perRequest.estMin, model.pricing.perRequest.estMax)}{" "}
          <span className="text-muted-foreground">
            (cap {formatMoney(model.pricing.perRequest.cap)})
          </span>
        </span>
      </div>

      <dl className="flex flex-col gap-1.5 rounded-lg border px-3.5 py-2.5 text-sm">
        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground">Input tokens</dt>
          <dd className="font-medium tabular-nums">
            {formatMoneyExact(model.pricing.rateCard.inputPerMillion)} / 1M
          </dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground">Output tokens</dt>
          <dd className="font-medium tabular-nums">
            {formatMoneyExact(model.pricing.rateCard.outputPerMillion)} / 1M
          </dd>
        </div>
      </dl>

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

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="model-prompt">Test prompt</Label>
        <Textarea
          id="model-prompt"
          placeholder={`Try a prompt against ${model.name}`}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Button onClick={handleTestCall}>
          {activePass ? "Test call (covered by pass)" : "Test call"}
        </Button>
        <Button variant="outline" onClick={() => setKeyOpen(true)}>
          <KeyRound aria-hidden />
          Generate API key
        </Button>
        {passEntries.length > 0 && (
          <Button variant="outline" onClick={() => setPassOpen(true)}>
            Buy a pass
          </Button>
        )}
      </div>

      <TestCallModal model={model} open={callOpen} onOpenChange={setCallOpen} />
      {passEntries.length > 0 && (
        <ModelPassPurchaseDialog
          model={model}
          open={passOpen}
          onOpenChange={setPassOpen}
          defaultType={initialBuyPass}
        />
      )}
      <CreateApiKeyDialog
        open={keyOpen}
        onOpenChange={setKeyOpen}
        defaultModelId={model.id}
        lockModel
      />
    </div>
  );
}
