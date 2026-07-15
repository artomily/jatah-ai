import Link from "next/link";
import { formatMoney, formatMoneyExact } from "@/lib/format";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export function BudgetProgress({
  label,
  cap,
  spent,
  linkToBudgets = false,
}: {
  label: string;
  cap: number | null;
  spent: number;
  linkToBudgets?: boolean;
}) {
  if (cap == null) {
    const body = (
      <div className="flex flex-col gap-2 rounded-xl border border-dashed bg-card/50 p-4">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">
          No budget set — spending is unrestricted.
        </p>
      </div>
    );
    return linkToBudgets ? (
      <Link href="/budgets" className="block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring">
        {body}
      </Link>
    ) : (
      body
    );
  }

  const pct = Math.min((spent / cap) * 100, 100);
  const remaining = Math.max(cap - spent, 0);
  const over = spent > cap;

  return (
    <div className="flex flex-col gap-2.5 rounded-xl border bg-card p-4 shadow-card">
      <div className="flex items-center justify-between text-sm">
        <p className="font-medium">{label}</p>
        <p className="tabular-nums text-muted-foreground">
          {formatMoney(spent)} / {formatMoneyExact(cap)}
        </p>
      </div>
      <Progress
        value={pct}
        className={cn(over && "[&>div]:bg-warning")}
        aria-label={`${label} budget: ${formatMoney(spent)} of ${formatMoneyExact(cap)} used`}
      />
      <p className={cn("text-xs", over ? "text-warning" : "text-muted-foreground")}>
        {over ? "Over budget" : `${formatMoney(remaining)} remaining`}
      </p>
    </div>
  );
}
