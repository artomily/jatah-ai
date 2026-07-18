import Link from "next/link";
import { MODELS } from "@/lib/data/models";
import { PASS_LABELS, formatMoneyExact } from "@/lib/format";
import type { PassType } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const TIERS = [
  {
    type: "pass_24h" as const,
    cta: "Get a 24 Hour Pass",
    body: "One deadline, one hackathon, one big push. Unlock a day of unlimited calls on the model you need.",
  },
  {
    type: "pass_7d" as const,
    cta: "Get a 7 Day Sprint",
    body: "A sprint week, a launch, a project deadline. Call as much as the week needs, then it's done.",
  },
  {
    type: "pass_30d" as const,
    cta: "Get a 30 Day Pro",
    body: "For models you lean on constantly — a month of access at a fraction of what per-request usage would cost.",
  },
];

/** Cheapest listed price for a pass type across the live catalog. */
function minPassPrice(type: PassType): number | undefined {
  const prices = MODELS.map((m) => m.pricing.passes[type]?.price).filter(
    (p): p is number => p != null,
  );
  return prices.length ? Math.min(...prices) : undefined;
}

export function PassTiers() {
  return (
    <section className="border-t bg-muted/30">
      <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-8 sm:py-28">
        <div className="mb-14 max-w-xl">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Or pay for a window, not a task
          </h2>
          <p className="mt-2 text-muted-foreground">
            Time passes work like a day pass at a gym — access for a window, set per
            model, priced from {formatMoneyExact(minPassPrice("pass_24h"))}.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {TIERS.map((tier, i) => (
            <div
              key={tier.type}
              className={cn(
                "flex flex-col gap-3 rounded-xl border bg-card p-6 shadow-card",
                i === 1 && "sm:-mt-4 sm:border-brand/40",
              )}
            >
              <p className="text-xs font-medium text-muted-foreground">{PASS_LABELS[tier.type]}</p>
              <p className="text-3xl font-semibold tracking-tight tabular-nums">
                from {formatMoneyExact(minPassPrice(tier.type))}
              </p>
              <p className="text-sm text-muted-foreground">{tier.body}</p>
              <Button
                className="mt-1"
                variant={i === 1 ? "default" : "outline"}
                asChild
              >
                <Link href={`/models?pass=${tier.type}`}>{tier.cta}</Link>
              </Button>
            </div>
          ))}
        </div>
        <p className="mt-8 text-sm text-muted-foreground">
          Passes never auto-renew — the demo wallet is pre-funded, so you can try one
          right now.
        </p>
      </div>
    </section>
  );
}
