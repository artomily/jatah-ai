import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function TryDemoBand() {
  return (
    <section className="border-t bg-primary text-primary-foreground">
      <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-6 px-4 py-20 text-center sm:px-8 sm:py-28">
        <h2 className="text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">
          Try it with a pre-funded wallet
        </h2>
        <p className="max-w-md text-primary-foreground/70">
          No signup, no card — the demo wallet already has balance loaded. Buy a pass or
          run a call and see the receipt for yourself.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button size="lg" variant="secondary" asChild>
            <Link href="/dashboard">
              Open the app
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="border-primary-foreground/20 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
            asChild
          >
            <Link href="/models">Browse models</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
