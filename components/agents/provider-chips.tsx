import { PROVIDER_META } from "@/lib/data/providers";
import type { Provider } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ProviderChips({
  providers,
  className,
}: {
  providers: Provider[];
  className?: string;
}) {
  return (
    <ul className={cn("flex flex-wrap items-center gap-1.5", className)} aria-label="Providers used">
      {providers.map((p) => (
        <li
          key={p}
          className="rounded-md border bg-muted/50 px-1.5 py-0.5 text-xs font-medium text-muted-foreground"
        >
          {PROVIDER_META[p].label}
        </li>
      ))}
    </ul>
  );
}
