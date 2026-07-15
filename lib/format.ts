import type { BudgetWindow, PassType } from "@/lib/types";

/** All money is stored in dollars, rounded to 4 decimals at every write. */
export function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}

function isInvalid(n: number | null | undefined): n is null | undefined {
  return n == null || !Number.isFinite(n);
}

/**
 * Adaptive money display for micro-billing:
 * >= $1 → 2dp · $0.01–1 → 2–3dp trimmed · < $0.01 → 4dp exact (never "<$0.01" —
 * exact micro-charges are the product) · 0 → $0.00 · invalid → --
 */
export function formatMoney(n: number | null | undefined): string {
  if (isInvalid(n)) return "--";
  if (n === 0 || Object.is(n, -0)) return "$0.00";
  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(n);
  let digits: string;
  if (abs >= 1) {
    digits = abs.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  } else if (abs >= 0.01) {
    digits = abs.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 3,
    });
  } else {
    digits = abs.toFixed(4);
  }
  return `${sign}$${digits}`;
}

/** Balances, pass prices, top-ups, budgets: always exactly 2dp. */
export function formatMoneyExact(n: number | null | undefined): string {
  if (isInvalid(n)) return "--";
  const safe = n === 0 || Object.is(n, -0) ? 0 : n;
  const sign = safe < 0 ? "-" : "";
  return `${sign}$${Math.abs(safe).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** Credits render as +$20.00 (color applied by the caller). */
export function formatCredit(n: number | null | undefined): string {
  if (isInvalid(n)) return "--";
  return `+${formatMoneyExact(Math.abs(n))}`;
}

/** Estimate ranges: "$0.04 – $0.06" (en dash). */
export function formatRange(min: number, max: number): string {
  return `${formatMoney(min)} – ${formatMoney(max)}`;
}

/** Counts: 480000 → "480K", 3400 → "3.4K". */
export function formatCompact(n: number | null | undefined): string {
  if (isInvalid(n)) return "--";
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n);
}

export function formatPercent(n: number | null | undefined): string {
  if (isInvalid(n)) return "--";
  if (n === 0) return "0%";
  if (n > 0 && n < 0.01) return "<1%";
  return `${Math.round(n * 100)}%`;
}

export function formatDuration(ms: number | null | undefined): string {
  if (isInvalid(ms)) return "--";
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

const RELATIVE_UNITS: Array<[Intl.RelativeTimeFormatUnit, number]> = [
  ["year", 1000 * 60 * 60 * 24 * 365],
  ["month", 1000 * 60 * 60 * 24 * 30],
  ["day", 1000 * 60 * 60 * 24],
  ["hour", 1000 * 60 * 60],
  ["minute", 1000 * 60],
];

export function formatRelative(ts: number, now: number = Date.now()): string {
  const diff = ts - now;
  const abs = Math.abs(diff);
  if (abs < 60 * 1000) return "just now";
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "always", style: "narrow" });
  for (const [unit, msPerUnit] of RELATIVE_UNITS) {
    if (abs >= msPerUnit) {
      return rtf.format(Math.trunc(diff / msPerUnit), unit);
    }
  }
  return "just now";
}

/** Remaining time on a pass: "4d 22h" / "3h 12m" / "8m". */
export function formatRemaining(expiresAt: number, now: number = Date.now()): string {
  const ms = expiresAt - now;
  if (ms <= 0) return "expired";
  const minutes = Math.floor(ms / (60 * 1000));
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  return `${Math.max(minutes, 1)}m`;
}

export function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatDateTime(ts: number): string {
  const d = new Date(ts);
  const date = d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return `${date} · ${formatTime(ts)}`;
}

/** Day-group labels: Today / Yesterday / "Mar 4" / "Mar 4, 2025". */
export function formatDayLabel(ts: number, now: number = Date.now()): string {
  const d = new Date(ts);
  const today = new Date(now);
  const yesterday = new Date(now - 24 * 60 * 60 * 1000);
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
  if (sameDay(d, today)) return "Today";
  if (sameDay(d, yesterday)) return "Yesterday";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(d.getFullYear() !== today.getFullYear() ? { year: "numeric" } : {}),
  });
}

/* ---- Budget windows (calendar-based, local time) ---- */

export function startOfToday(now: number = Date.now()): number {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** Week starts Monday 00:00 local. */
export function startOfWeek(now: number = Date.now()): number {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0 = Sunday
  const back = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - back);
  return d.getTime();
}

export function startOfMonth(now: number = Date.now()): number {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  d.setDate(1);
  return d.getTime();
}

export function budgetWindowStart(window: BudgetWindow, now: number = Date.now()): number {
  if (window === "daily") return startOfToday(now);
  if (window === "weekly") return startOfWeek(now);
  return startOfMonth(now);
}

export const BUDGET_WINDOW_LABELS: Record<BudgetWindow, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
};

export const PASS_DURATIONS_MS: Record<PassType, number> = {
  pass_24h: 24 * 60 * 60 * 1000,
  pass_7d: 7 * 24 * 60 * 60 * 1000,
  pass_30d: 30 * 24 * 60 * 60 * 1000,
};

export const PASS_LABELS: Record<PassType, string> = {
  pass_24h: "24 Hour Pass",
  pass_7d: "7 Day Sprint",
  pass_30d: "30 Day Pro",
};

export const PASS_SHORT_LABELS: Record<PassType, string> = {
  pass_24h: "24h",
  pass_7d: "7d",
  pass_30d: "30d",
};
