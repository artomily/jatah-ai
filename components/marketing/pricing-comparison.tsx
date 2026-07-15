import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

const ROWS = [
  { label: "Transparent per-task cost", trad: false, jatah: true },
  { label: "Hard maximum charge", trad: false, jatah: true },
  { label: "Approval before every charge", trad: false, jatah: true },
  { label: "Pay only for what you use", trad: false, jatah: true },
  { label: "Short-term access (24h / 7d)", trad: false, jatah: true },
  { label: "Itemized receipts", trad: false, jatah: true },
];

const PERSONAS = [
  {
    name: "Weekend builder",
    usage: "One hackathon, ~40 runs",
    subscription: "$20.00",
    jatah: "$2.10",
    winner: "jatah" as const,
  },
  {
    name: "Daily power user",
    usage: "~300 runs a month",
    subscription: "$20.00",
    jatah: "$16.80",
    winner: "jatah" as const,
  },
  {
    name: "Heavy sprint week",
    usage: "Deadline week, constant use",
    subscription: "$20.00",
    jatah: "$9.00",
    jatahNote: "7 Day Sprint",
    winner: "jatah" as const,
  },
];

export function PricingComparison() {
  return (
    <section id="pricing" className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-8 sm:py-28">
      <div className="mb-14 max-w-xl">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          One price for everyone was never going to work
        </h2>
        <p className="mt-2 text-muted-foreground">
          A flat monthly subscription overcharges casual use and undercharges heavy use.
          Adaptive billing charges what each task actually costs.
        </p>
      </div>

      <div className="grid grid-cols-1 overflow-hidden rounded-xl border md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="hidden items-center border-b bg-muted/30 p-5 md:flex" />
        <div className="border-b bg-muted/30 p-5 md:border-b md:border-l">
          <p className="font-medium text-muted-foreground">Traditional AI</p>
          <p className="text-xs text-muted-foreground/70">Monthly subscription only</p>
        </div>
        <div className="border-b border-l bg-brand-soft p-5">
          <p className="font-medium text-brand dark:text-sidebar-accent-foreground">
            Jatah Ai
          </p>
          <p className="text-xs text-muted-foreground">Usage, 24h, 7d, or 30d</p>
        </div>

        {ROWS.map((row, i) => (
          <div key={row.label} className="contents">
            <div
              className={cn(
                "p-5 text-sm font-medium",
                i !== ROWS.length - 1 && "border-b",
              )}
            >
              {row.label}
            </div>
            <div
              className={cn(
                "flex items-center border-l p-5",
                i !== ROWS.length - 1 && "border-b",
              )}
            >
              {row.trad ? (
                <Check className="size-4 text-success" aria-hidden />
              ) : (
                <X className="size-4 text-muted-foreground/40" aria-hidden />
              )}
            </div>
            <div
              className={cn(
                "flex items-center border-l bg-brand-soft/40 p-5",
                i !== ROWS.length - 1 && "border-b",
              )}
            >
              {row.jatah ? (
                <Check className="size-4 text-success" aria-hidden />
              ) : (
                <X className="size-4 text-muted-foreground/40" aria-hidden />
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-16">
        <h3 className="text-lg font-semibold tracking-tight">
          Who saves, and how much
        </h3>
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {PERSONAS.map((p) => (
            <div key={p.name} className="rounded-xl border bg-card p-5 shadow-card">
              <p className="font-medium">{p.name}</p>
              <p className="text-xs text-muted-foreground">{p.usage}</p>
              <div className="mt-4 flex items-end justify-between gap-3 border-t pt-4">
                <div>
                  <p className="text-xs text-muted-foreground">Subscription</p>
                  <p className="text-sm tabular-nums text-muted-foreground line-through decoration-1">
                    {p.subscription}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">
                    {"jatahNote" in p ? p.jatahNote : "Jatah Ai"}
                  </p>
                  <p className="text-lg font-semibold tabular-nums text-success">
                    {p.jatah}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
