import { Check } from "lucide-react";
import { formatCompact } from "@/lib/format";
import { cn } from "@/lib/utils";

const TIERS = [
  {
    name: "Basic",
    blurb: "Everyday utility calls — fast, cheap, always on.",
    tokenLimit: 8_000_000,
    models: ["Claude Haiku 4.5", "GPT-5 Mini"],
    price24h: "$1.50",
    price1w: "$5.00",
  },
  {
    name: "Standard",
    blurb: "Most teams' daily driver — reasoning without the frontier price.",
    tokenLimit: 20_000_000,
    models: ["Claude Sonnet 5", "Gemini 2.5 Pro"],
    price24h: "$3.50",
    price1w: "$10.00",
    highlight: true,
  },
  {
    name: "Premium",
    blurb: "Frontier models for the runs that can't afford to be wrong.",
    tokenLimit: 40_000_000,
    models: ["GPT-5", "Claude Opus 4.8"],
    price24h: "$6.00",
    price1w: "$16.00",
  },
];

export function SubscriptionTiers() {
  return (
    <section className="border-t">
      <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-8 sm:py-28">
        <div className="mb-14 max-w-xl">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            A tier, a token allowance, no per-call tracking
          </h2>
          <p className="mt-2 text-muted-foreground">
            Basic, Standard, or Premium — pick a model tier and a token allowance,
            available for a 24 Hour window or a full Week. Still no auto-renewal, still
            no surprise charges.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {TIERS.map((tier) => (
            <div
              key={tier.name}
              className={cn(
                "flex flex-col gap-5 rounded-xl border bg-card p-6 shadow-card",
                tier.highlight && "sm:-mt-4 sm:border-brand/40",
              )}
            >
              <div>
                {tier.highlight && (
                  <p className="mb-2 text-xs font-medium text-brand dark:text-sidebar-accent-foreground">
                    Most teams start here
                  </p>
                )}
                <p className="text-lg font-semibold tracking-tight">{tier.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">{tier.blurb}</p>
              </div>

              <div className="flex items-center justify-between border-t pt-4">
                <div>
                  <p className="text-xs text-muted-foreground">24 Hour</p>
                  <p className="text-xl font-semibold tracking-tight tabular-nums">
                    {tier.price24h}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">1 Week</p>
                  <p className="text-xl font-semibold tracking-tight tabular-nums">
                    {tier.price1w}
                  </p>
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="text-xs font-medium text-muted-foreground">
                  {formatCompact(tier.tokenLimit)} tokens included
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground/70">
                  Per window — resets when a new pass starts.
                </p>
              </div>

              <ul className="flex flex-col gap-2 border-t pt-4">
                {tier.models.map((model) => (
                  <li key={model} className="flex items-center gap-2 text-sm">
                    <Check className="size-3.5 shrink-0 text-success" aria-hidden />
                    {model}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="mt-6 text-xs text-muted-foreground">
          Go over your token allowance and the run just falls back to usage billing at
          the model&apos;s normal rate — never blocked, never a surprise.
        </p>
      </div>
    </section>
  );
}
