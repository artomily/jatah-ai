"use client";

import { useEffect, useState } from "react";

/**
 * The current time, refreshed every `intervalMs`. Starts as `null` so the
 * very first client render matches the server (avoiding a hydration
 * mismatch on clock-derived text), then flips to a real timestamp once
 * mounted and ticks from there.
 *
 * The initial synchronous setState is intentional: it seeds the clock on
 * mount before the setInterval subscription takes over. This is the
 * standard hydration-safe pattern for clock values, not an accidental
 * cascading update.
 */
export function useNow(intervalMs = 30_000): number | null {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return now;
}
