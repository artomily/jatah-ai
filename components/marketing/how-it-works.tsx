import Link from "next/link";
import { formatMoney } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const STEPS = [
  {
    n: "01",
    title: "Pick an agent",
    body: "Browse by category, see ratings and runs, and check which billing models the creator has enabled — usage, passes, or both.",
    vignette: (
      <div className="flex items-center gap-3 rounded-lg border bg-card p-3 shadow-card">
        <span className="flex size-9 items-center justify-center rounded-lg bg-brand-soft text-sm font-semibold text-brand dark:text-sidebar-accent-foreground">
          Sc
        </span>
        <div>
          <p className="text-sm font-medium">Scout</p>
          <p className="text-xs text-muted-foreground">Deep web research</p>
        </div>
        <Badge variant="secondary" className="ml-auto">
          Featured
        </Badge>
      </div>
    ),
  },
  {
    n: "02",
    title: "Approve the estimate",
    body: "See the estimated cost and the hard maximum before anything runs. Nothing charges without your explicit approval.",
    vignette: (
      <div className="flex items-center justify-between rounded-lg border bg-card p-3 shadow-card text-sm">
        <span className="text-muted-foreground">Maximum charge</span>
        <span className="font-semibold tabular-nums">{formatMoney(0.08)}</span>
      </div>
    ),
  },
  {
    n: "03",
    title: "Get a receipt",
    body: "Every run closes with an itemized breakdown — per-provider cost, execution time, and exactly where your money went.",
    vignette: (
      <div className="flex items-center justify-between rounded-lg border bg-card p-3 shadow-card text-sm">
        <span className="text-muted-foreground">Total charged</span>
        <span className="font-semibold tabular-nums text-success">{formatMoney(0.052)}</span>
      </div>
    ),
  },
];

export function HowItWorks() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-8 sm:py-28">
      <div className="mb-14 max-w-xl">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">How it works</h2>
        <p className="mt-2 text-muted-foreground">
          Three steps, every time — no matter which agent or which billing model.
        </p>
      </div>
      <div className="flex flex-col gap-12">
        {STEPS.map((step, i) => (
          <div
            key={step.n}
            className={`flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-10 ${
              i % 2 === 1 ? "sm:flex-row-reverse" : ""
            }`}
          >
            <div className="sm:w-1/2">
              <span className="text-sm font-mono text-muted-foreground/60">{step.n}</span>
              <h3 className="mt-1 text-xl font-semibold tracking-tight">{step.title}</h3>
              <p className="mt-2 max-w-md text-muted-foreground">{step.body}</p>
            </div>
            <div className="sm:w-1/2">{step.vignette}</div>
          </div>
        ))}
      </div>
      <div className="mt-14">
        <Button variant="outline" asChild>
          <Link href="/marketplace">See it live in the marketplace</Link>
        </Button>
      </div>
    </section>
  );
}
