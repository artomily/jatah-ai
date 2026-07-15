"use client";

import { formatRemaining } from "@/lib/format";
import { useNow } from "@/hooks/use-now";

/**
 * Live time-remaining label. Renders "…" on the server and first client paint
 * (via useNow), then ticks every 30s once mounted.
 */
export function PassCountdown({ expiresAt }: { expiresAt: number }) {
  const now = useNow();

  return (
    <span className="tabular-nums" suppressHydrationWarning>
      {now == null ? "…" : formatRemaining(expiresAt, now)}
    </span>
  );
}
