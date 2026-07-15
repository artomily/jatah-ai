import { TriangleAlert } from "lucide-react";
import { BUDGET_WINDOW_LABELS, formatMoney } from "@/lib/format";
import type { BudgetWarning } from "@/lib/store/app-store";

export function BudgetWarningCard({ warning }: { warning: BudgetWarning }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-warning/30 bg-warning-soft px-4 py-3 text-sm text-warning">
      <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
      <p>
        <span className="font-medium">
          {BUDGET_WINDOW_LABELS[warning.window]} budget: {formatMoney(warning.remaining)} left.
        </span>{" "}
        This run may cost up to {formatMoney(warning.cap)}, which could take you over.
      </p>
    </div>
  );
}
