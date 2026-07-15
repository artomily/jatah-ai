import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CostEstimateCard } from "@/components/billing/cost-estimate-card";
import { ReceiptCard } from "@/components/billing/receipt-card";
import { WatchDemoDialog } from "@/components/marketing/watch-demo-dialog";
import { Button } from "@/components/ui/button";
import type { Transaction } from "@/lib/types";

const SAMPLE_RECEIPT: Transaction = {
  id: "txn_8f3a1c",
  type: "usage",
  createdAt: Date.parse("2026-07-15T13:06:00"),
  amount: 0.052,
  agentId: "agent_scout",
  agentName: "Scout",
  taskPrompt: "Competitive landscape for micro-billing infra",
  breakdown: [
    { provider: "search", label: "Search · web queries", amount: 0.016 },
    { provider: "openai", label: "OpenAI · GPT-5 tokens", amount: 0.024 },
    { provider: "embedding", label: "Embeddings · vector ops", amount: 0.012 },
  ],
  executionMs: 2400,
  estimate: { estMin: 0.04, estMax: 0.06, cap: 0.08 },
};

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute top-0 right-0 -z-10 size-[640px] rounded-full bg-brand opacity-[0.04] blur-3xl"
        aria-hidden
      />
      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-16 px-4 py-20 sm:px-8 sm:py-28 lg:grid-cols-[1.05fr_1fr] lg:py-36">
        <div className="flex flex-col items-start gap-6">
          <span className="rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground">
            Powered by x402
          </span>
          <h1 className="text-4xl leading-[1.08] font-semibold tracking-tight sm:text-5xl lg:text-6xl">
            You don&apos;t know what your AI subscription actually costs you.
          </h1>
          <p className="max-w-lg text-lg text-muted-foreground">
            We do — down to the cent, before it happens and after. Pay per request with a
            hard cap, or unlock a time pass when a burst of work makes more sense.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Button size="lg" asChild>
              <Link href="/marketplace">
                Explore agents
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/creator">Start building</Link>
            </Button>
            <WatchDemoDialog />
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-x-6 -inset-y-6 -z-10 hidden rounded-3xl border bg-card/40 lg:block" />
          <div className="flex flex-col gap-4 sm:flex-row lg:flex-col">
            <CostEstimateCard
              estimate={{ estMin: 0.04, estMax: 0.06, cap: 0.08 }}
              executionMsHint={2400}
              className="sm:-rotate-2"
            />
            <ReceiptCard txn={SAMPLE_RECEIPT} className="sm:rotate-1" />
          </div>
        </div>
      </div>
    </section>
  );
}
