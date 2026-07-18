import { ChevronDown } from "lucide-react";

const FAQS = [
  {
    q: "What is a time pass?",
    a: "Unlimited calls on one model for the length of the window — 24 hours, 7 days, or 30 days. It never auto-renews; when it's over, it's just over.",
  },
  {
    q: "What happens when it expires?",
    a: "Calls fall back to per-request billing on that model — same estimate-then-approve flow, with a hard cap on every request.",
  },
  {
    q: "How do I pay?",
    a: "From a pre-funded demo balance, or a Stellar testnet wallet. Either way, no real charges — this is a demo.",
  },
  {
    q: "What's the hard cap?",
    a: "Every request shows an estimate and a maximum before it runs. If actual usage comes in higher than expected, you're charged the cap — never more, and never a surprise.",
  },
  {
    q: "Is this real money?",
    a: "No. Jatah Ai is a demo product — payments settle via x402 and the Stellar testnet, not real currency.",
  },
  {
    q: "Do passes cover every model?",
    a: "Most models offer at least one pass length. A few high-volume, low-cost models are usage-only and show \"Usage only\" instead of pass pricing.",
  },
];

export function Faq() {
  return (
    <section id="faq" className="scroll-mt-20 border-t">
      <div className="mx-auto w-full max-w-3xl px-4 py-20 sm:px-8 sm:py-28">
        <div className="mb-10 max-w-xl">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Questions, answered plainly
          </h2>
          <p className="mt-2 text-muted-foreground">
            No fine print — here&apos;s exactly how billing works.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          {FAQS.map((item) => (
            <details
              key={item.q}
              className="group rounded-xl border bg-card px-5 py-4 shadow-card"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-medium marker:content-none [&::-webkit-details-marker]:hidden">
                {item.q}
                <ChevronDown
                  className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
                  aria-hidden
                />
              </summary>
              <p className="mt-3 text-sm text-muted-foreground">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
