import { PASS_LABELS } from "@/lib/format";
import { cn } from "@/lib/utils";

const TIERS = [
  {
    type: "pass_24h" as const,
    from: "$1.50",
    body: "One deadline, one hackathon, one big push. Unlock a day of unlimited calls on the model you need.",
  },
  {
    type: "pass_7d" as const,
    from: "$7.00",
    body: "A sprint week, a launch, a project deadline. Call as much as the week needs, then it's done.",
  },
  {
    type: "pass_30d" as const,
    from: "$18.00",
    body: "For models you lean on constantly — a month of access at a fraction of what per-request usage would cost.",
  },
];

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
            model, priced from $1.50.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {TIERS.map((tier, i) => (
            <div
              key={tier.type}
              className={cn(
                "flex flex-col gap-3 rounded-xl border bg-card p-6 shadow-card",
                i === 1 && "sm:-mt-4",
              )}
            >
              <p className="text-xs font-medium text-muted-foreground">{PASS_LABELS[tier.type]}</p>
              <p className="text-3xl font-semibold tracking-tight tabular-nums">
                from {tier.from}
              </p>
              <p className="text-sm text-muted-foreground">{tier.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
