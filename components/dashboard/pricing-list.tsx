"use client";

import { useState } from "react";
import Link from "next/link";
import { Lock, Ticket, Unlock } from "lucide-react";
import { PASS_LABELS, formatMoneyExact, formatRange } from "@/lib/format";
import { MODELS } from "@/lib/data/models";
import type { AiModel, PassType } from "@/lib/types";
import { useModelCoverage } from "@/lib/store/hooks";
import { ModelPassPurchaseDialog } from "@/components/models/model-pass-purchase-dialog";
import { PassCountdown } from "@/components/billing/pass-countdown";
import { Button } from "@/components/ui/button";

export function PricingList() {
  const [selectedModel, setSelectedModel] = useState<AiModel | null>(null);

  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-card p-5 shadow-card">
      <div>
        <h2 className="text-sm font-semibold tracking-tight">Pricing</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Buy a time pass for any model right here — no per-request charges while it&apos;s
          active.
        </p>
      </div>

      <div className="flex flex-col divide-y">
        {MODELS.map((model) => (
          <ModelPricingRow key={model.id} model={model} onBuyPass={setSelectedModel} />
        ))}
      </div>

      {selectedModel && (
        <ModelPassPurchaseDialog
          model={selectedModel}
          open={selectedModel != null}
          onOpenChange={(open) => {
            if (!open) setSelectedModel(null);
          }}
        />
      )}
    </div>
  );
}

function ModelPricingRow({
  model,
  onBuyPass,
}: {
  model: AiModel;
  onBuyPass: (model: AiModel) => void;
}) {
  const passEntries = Object.entries(model.pricing.passes) as Array<
    [PassType, { price: number }]
  >;
  const activePass = useModelCoverage(model.id);

  return (
    <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <Link href={`/models/${model.slug}`} className="font-medium hover:underline">
            {model.name}
          </Link>
          {activePass ? (
            <span className="flex items-center gap-1 text-xs font-medium text-success">
              <Unlock className="size-3 shrink-0" aria-hidden />
              Unlocked
            </span>
          ) : (
            passEntries.length > 0 && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground/70">
                <Lock className="size-3 shrink-0" aria-hidden />
                Locked
              </span>
            )
          )}
        </div>
        <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{model.tagline}</p>
        {activePass ? (
          <p className="mt-1 text-xs tabular-nums text-success">
            Covered by your {activePass.tierName ? `${activePass.tierName} tier ` : ""}
            {PASS_LABELS[activePass.type]} —{" "}
            <PassCountdown expiresAt={activePass.expiresAt} /> left
          </p>
        ) : (
          <p className="mt-1 text-xs tabular-nums text-muted-foreground">
            {formatRange(model.pricing.perRequest.estMin, model.pricing.perRequest.estMax)} per
            request
          </p>
        )}
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2">
        {passEntries.map(([type, { price }]) => (
          <span
            key={type}
            className="rounded-lg border px-2.5 py-1.5 text-xs tabular-nums text-muted-foreground"
          >
            {PASS_LABELS[type]} · {formatMoneyExact(price)}
          </span>
        ))}
        {passEntries.length > 0 ? (
          <Button size="sm" variant={activePass ? "outline" : "default"} onClick={() => onBuyPass(model)}>
            <Ticket aria-hidden />
            {activePass ? "Extend pass" : "Buy a pass"}
          </Button>
        ) : (
          <span className="text-xs text-muted-foreground">Usage only</span>
        )}
      </div>
    </div>
  );
}
