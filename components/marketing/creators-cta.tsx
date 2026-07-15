import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CreatorsCta() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-8 sm:py-28">
      <div className="flex flex-col items-start gap-6 rounded-2xl border bg-primary px-8 py-14 text-primary-foreground sm:px-14">
        <h2 className="max-w-lg text-2xl font-semibold tracking-tight sm:text-3xl">
          Building an agent? You decide how it&apos;s billed.
        </h2>
        <p className="max-w-lg text-primary-foreground/70">
          Enable pay-per-request, time passes, or both. Set your own estimate ranges and
          caps. Payouts settle via x402 — no invoicing, no chasing.
        </p>
        <Button size="lg" variant="secondary" asChild>
          <Link href="/creator">
            Open Creator Studio
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </Button>
      </div>
    </section>
  );
}
