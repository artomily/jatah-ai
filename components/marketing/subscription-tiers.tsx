import Link from "next/link";
import { Check } from "lucide-react";
import { TIERS, tierModels } from "@/lib/data/tiers";
import { formatCompact, formatMoneyExact } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function SubscriptionTiers() {
  return (
    <section className="border-t">
      <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-8 sm:py-28">
        <div className="mb-14 max-w-xl">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Prefer predictable? Pick a pass tier
          </h2>
          <p className="mt-2 text-muted-foreground">
            These aren&apos;t subscriptions — they&apos;re bundle passes in six sizes.
            One price, several models, a shared token allowance for a 24 Hour window or
            a full Week. No auto-renewal, no surprise charges.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {TIERS.map((tier) => (
            <div
              key={tier.id}
              className={cn(
                "flex flex-col gap-5 rounded-xl border bg-card p-6 shadow-card",
                tier.slug === "standard" && "lg:-mt-4 lg:border-brand/40",
              )}
            >
              <div>
                {tier.slug === "standard" && (
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
                  {tier.passes.pass_24h ? (
                    <p className="text-xl font-semibold tracking-tight tabular-nums">
                      {formatMoneyExact(tier.passes.pass_24h.price)}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground/70">Not offered</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">1 Week</p>
                  {tier.passes.pass_7d ? (
                    <p className="text-xl font-semibold tracking-tight tabular-nums">
                      {formatMoneyExact(tier.passes.pass_7d.price)}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground/70">Not offered</p>
                  )}
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="text-xs font-medium text-muted-foreground">
                  {formatCompact(tier.tokenLimit)} tokens included
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground/70">
                  Shared across every model below — resets when a new pass starts.
                </p>
              </div>

              <ul className="flex flex-col gap-2 border-t pt-4">
                {tierModels(tier).map((model) => (
                  <li key={model.id} className="flex items-center gap-2 text-sm">
                    <Check className="size-3.5 shrink-0 text-success" aria-hidden />
                    {model.name}
                  </li>
                ))}
              </ul>

              <Button variant={tier.slug === "standard" ? "default" : "outline"} asChild>
                <Link href={`/tiers?buy=${tier.slug}`}>Get the {tier.name} pass</Link>
              </Button>
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
