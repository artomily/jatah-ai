"use client";

import { useSyncExternalStore } from "react";

function subscribe() {
  return () => {};
}

/**
 * True only after the client has mounted. Uses useSyncExternalStore (not a
 * useEffect + setState flag) so React can schedule the post-hydration update
 * itself instead of us calling setState synchronously in an effect body.
 */
export function useMounted(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
