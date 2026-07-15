"use client";

import Link from "next/link";
import { PASS_SHORT_LABELS } from "@/lib/format";
import { useAppStore } from "@/lib/store/app-store";
import type { Agent, BillingModel, PassType } from "@/lib/types";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export function AgentPricingRow({ agent }: { agent: Agent }) {
  const overrides = useAppStore((s) => s.creatorPricing[agent.id]);
  const setCreatorPricing = useAppStore((s) => s.setCreatorPricing);

  const isEnabled = (model: BillingModel) => overrides?.[model] !== false;

  const models: Array<{ model: BillingModel; label: string }> = [
    ...(agent.pricing.perRequest ? [{ model: "perRequest" as BillingModel, label: "Per request" }] : []),
    ...(Object.keys(agent.pricing.passes) as PassType[]).map((type) => ({
      model: type as BillingModel,
      label: PASS_SHORT_LABELS[type],
    })),
  ];

  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-card sm:flex-row sm:items-center sm:justify-between">
      <Link
        href={`/agents/${agent.slug}`}
        className="font-medium hover:underline"
      >
        {agent.name}
      </Link>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        {models.map(({ model, label }) => {
          const id = `${agent.id}-${model}`;
          return (
            <div key={model} className="flex items-center gap-2">
              <Switch
                id={id}
                checked={isEnabled(model)}
                onCheckedChange={(checked) => setCreatorPricing(agent.id, model, checked)}
              />
              <Label htmlFor={id} className="text-xs text-muted-foreground">
                {label}
              </Label>
            </div>
          );
        })}
      </div>
    </div>
  );
}
