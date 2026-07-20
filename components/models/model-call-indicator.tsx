"use client";

import { useEffect, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const STEPS = ["Sending request", "Generating response"];

/** Progress + step ticker while the model call executes — live or simulated. */
export function ModelCallIndicator({
  executionMs,
  live = false,
}: {
  executionMs: number;
  live?: boolean;
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
    Math.floor((elapsed / executionMs) * STEPS.length),
    STEPS.length - 1,
  );

  return (
    <div className="flex flex-col gap-4 py-2">
      <Progress value={progress} aria-label="Call progress" />
      <ul className="flex flex-col gap-2 text-sm" aria-live="polite">
        {STEPS.map((label, i) => (
          <li
            key={label}
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
            {label}
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted-foreground">
        {live
          ? "Calling the live model — the receipt itemizes real input vs. output tokens."
          : "Simulating this call — the receipt itemizes input vs. output the same way."}
      </p>
    </div>
  );
}
