import Link from "next/link";
import { cn } from "@/lib/utils";

/** Two bars: the tall one is time, the short one is usage. */
export function LogoMark({
  className,
  inverted = false,
}: {
  className?: string;
  inverted?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className={cn("size-5", className)}
    >
      <rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="5.5"
        className={inverted ? "fill-white" : "fill-primary"}
      />
      <rect
        x="8"
        y="7.5"
        width="3"
        height="9"
        rx="1.5"
        className={inverted ? "fill-zinc-900" : "fill-primary-foreground"}
      />
      <rect
        x="13"
        y="11.5"
        width="3"
        height="5"
        rx="1.5"
        className={inverted ? "fill-zinc-900/60" : "fill-primary-foreground/60"}
      />
    </svg>
  );
}

export function Logo({
  href = "/",
  className,
}: {
  href?: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2 rounded-lg font-semibold tracking-tight outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      <LogoMark />
      <span>
        Jatah<span className="text-muted-foreground"> Ai</span>
      </span>
    </Link>
  );
}
