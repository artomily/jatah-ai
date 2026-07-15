"use client";

import { useEffect, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { PROVIDER_META } from "@/lib/data/providers";
import type { Provider } from "@/lib/types";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

/** Progress + provider step ticker while the (simulated) run executes. */
export function RunningIndicator({
  providers,
  executionMs,
}: {
  providers: Provider[];
  executionMs: number;
}) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const startedAt = Date.now();
    const interval = setInterval(() => {
      setElapsed(Date.now() - startedAt);
    }, 80);
    return () => clearInterval(interval);
  }, [executionMs]);

  const progress = Math.min((elapsed / executionMs) * 100, 97);
  const stepIndex = Math.min(
    Math.floor((elapsed / executionMs) * providers.length),
    providers.length - 1,
  );

  return (
    <div className="flex flex-col gap-4 py-2">
      <Progress value={progress} aria-label="Run progress" />
      <ul className="flex flex-col gap-2 text-sm" aria-live="polite">
        {providers.map((provider, i) => (
          <li
            key={provider}
            className={cn(
              "flex items-center gap-2 transition-opacity duration-300",
              i < stepIndex && "text-muted-foreground",
              i === stepIndex && "font-medium",
              i > stepIndex && "text-muted-foreground/50",
            )}
          >
            {i === stepIndex ? (
              <LoaderCircle className="size-3.5 animate-spin text-brand" aria-hidden />
            ) : (
              <span
                className={cn(
                  "size-1.5 rounded-full",
                  i < stepIndex ? "bg-success" : "bg-border",
                )}
                aria-hidden
              />
            )}
            {PROVIDER_META[provider].receiptLabel}
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted-foreground">
        Metering usage as it happens — the receipt itemizes every provider below.
      </p>
    </div>
  );
}
