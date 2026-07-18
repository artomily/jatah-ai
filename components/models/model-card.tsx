import Link from "next/link";
import { MODEL_PROVIDER_LABELS } from "@/lib/types";
import { PASS_SHORT_LABELS, formatCompact, formatMoney, formatMoneyExact } from "@/lib/format";
import type { AiModel, PassType } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

export function ModelCard({
  model,
  highlightPass,
}: {
  model: AiModel;
  highlightPass?: PassType;
}) {
  const passEntry = highlightPass ? model.pricing.passes[highlightPass] : undefined;
  const href = highlightPass
    ? `/models/${model.slug}?buy=${highlightPass}`
    : `/models/${model.slug}`;

  return (
    <Link
      href={href}
      className="group flex flex-col gap-3 rounded-xl border bg-card p-5 shadow-card transition-all outline-none hover:border-foreground/15 hover:shadow-pop focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold tracking-tight group-hover:text-brand">
            {model.name}
          </h3>
          <p className="text-xs text-muted-foreground">
            {MODEL_PROVIDER_LABELS[model.provider]}
          </p>
        </div>
        {model.featured && (
          <Badge
            variant="secondary"
            className="bg-brand-soft text-brand dark:text-sidebar-accent-foreground"
          >
            Featured
          </Badge>
        )}
      </div>

      <p className="line-clamp-2 min-h-10 text-sm leading-5 text-muted-foreground">
        {model.tagline}
      </p>

      <div className="mt-auto flex items-center justify-between border-t pt-3 text-sm">
        <span className="text-xs text-muted-foreground tabular-nums">
          {formatCompact(model.contextWindow)} context
        </span>
        {highlightPass ? (
          passEntry ? (
            <span className="font-medium tabular-nums">
              {PASS_SHORT_LABELS[highlightPass]} pass · {formatMoneyExact(passEntry.price)}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">
              no {PASS_SHORT_LABELS[highlightPass]} pass
            </span>
          )
        ) : (
          <span className="font-medium tabular-nums">
            from {formatMoney(model.pricing.perRequest.estMin)}/call
          </span>
        )}
      </div>
    </Link>
  );
}
