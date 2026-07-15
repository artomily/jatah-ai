"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Blocks,
  ChartNoAxesColumn,
  Gauge,
  LayoutDashboard,
  ReceiptText,
  Store,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const SECTIONS: Array<{ label: string; items: NavItem[] }> = [
  {
    label: "Browse",
    items: [{ href: "/marketplace", label: "Marketplace", icon: Store }],
  },
  {
    label: "Your account",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/wallet", label: "Wallet", icon: Wallet },
      { href: "/transactions", label: "Transactions", icon: ReceiptText },
      { href: "/analytics", label: "Analytics", icon: ChartNoAxesColumn },
      { href: "/budgets", label: "Budgets", icon: Gauge },
    ],
  },
  {
    label: "Build",
    items: [{ href: "/creator", label: "Creator Studio", icon: Blocks }],
  },
];

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Main" className="flex flex-1 flex-col gap-5">
      {SECTIONS.map((section) => (
        <div key={section.label}>
          <p className="px-2.5 pb-1.5 text-[11px] font-medium tracking-wide text-muted-foreground/80 uppercase">
            {section.label}
          </p>
          <ul className="flex flex-col gap-0.5">
            {section.items.map((item) => {
              const active =
                pathname === item.href ||
                (item.href === "/marketplace" && pathname.startsWith("/agents"));
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      active
                        ? "bg-brand-soft text-brand dark:text-sidebar-accent-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <item.icon className="size-4" aria-hidden />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
