"use client";

import { Ticket } from "lucide-react";
import { useAppStore, useHydrated } from "@/lib/store/app-store";
import { useNow } from "@/hooks/use-now";
import { getActivePasses, getExpiredPasses } from "@/lib/store/selectors";
import { PassCard } from "@/components/billing/pass-card";
import { Skeleton } from "@/components/ui/skeleton";

export function PassesSection() {
  const hydrated = useHydrated();
  const passes = useAppStore((s) => s.passes);
  const now = useNow();

  if (!hydrated || now == null) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Skeleton className="h-16 rounded-xl" />
        <Skeleton className="h-16 rounded-xl" />
      </div>
    );
  }

  const active = getActivePasses(passes, now);
  const expired = getExpiredPasses(passes, now).slice(0, 3);

  if (active.length === 0 && expired.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed py-10 text-center">
        <Ticket className="size-5 text-muted-foreground" aria-hidden />
        <p className="text-sm font-medium">No time passes yet</p>
        <p className="text-xs text-muted-foreground">
          Buy a pass from an agent&apos;s page to run it without per-request charges.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {active.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {active.map((pass) => (
            <PassCard key={pass.id} pass={pass} />
          ))}
        </div>
      )}
      {expired.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-medium text-muted-foreground">Expired</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {expired.map((pass) => (
              <PassCard key={pass.id} pass={pass} expired />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
