"use client";

import { useState } from "react";
import Link from "next/link";
import { Ticket } from "lucide-react";
import { PASS_LABELS, formatMoneyExact, formatRange } from "@/lib/format";
import { MODELS } from "@/lib/data/models";
import type { AiModel, PassType } from "@/lib/types";
import { ModelPassPurchaseDialog } from "@/components/models/model-pass-purchase-dialog";
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
        {MODELS.map((model) => {
          const passEntries = Object.entries(model.pricing.passes) as Array<
            [PassType, { price: number }]
          >;
          return (
            <div
              key={model.id}
              className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <Link
                  href={`/models/${model.slug}`}
                  className="font-medium hover:underline"
                >
                  {model.name}
                </Link>
                <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                  {model.tagline}
                </p>
                <p className="mt-1 text-xs tabular-nums text-muted-foreground">
                  {formatRange(model.pricing.perRequest.estMin, model.pricing.perRequest.estMax)}{" "}
                  per request
                </p>
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
                  <Button size="sm" onClick={() => setSelectedModel(model)}>
                    <Ticket aria-hidden />
                    Buy a pass
                  </Button>
                ) : (
                  <span className="text-xs text-muted-foreground">Usage only</span>
                )}
              </div>
            </div>
          );
        })}
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
