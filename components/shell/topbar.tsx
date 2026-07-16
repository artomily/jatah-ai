"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, Search } from "lucide-react";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { WalletPill } from "@/components/shell/wallet-pill";
import { SidebarNav } from "@/components/shell/sidebar-nav";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { openCommandPalette } from "@/components/command-palette";

const TITLES: Array<[string, string]> = [
  ["/agents", "Agent details"],
  ["/models", "Models"],
  ["/api-keys", "API Keys"],
  ["/dashboard", "Dashboard"],
  ["/wallet", "Wallet"],
  ["/transactions", "Transactions"],
  ["/analytics", "Analytics"],
  ["/budgets", "Budgets"],
  ["/creator", "Creator Studio"],
];

export function Topbar() {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const title = TITLES.find(([prefix]) => pathname.startsWith(prefix))?.[1] ?? "";

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/85 px-4 backdrop-blur-sm lg:px-8">
      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label="Open navigation"
          >
            <Menu />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-4">
          <SheetHeader className="p-0 pb-4 text-left">
            <SheetTitle asChild>
              <Logo href="/dashboard" className="text-base" />
            </SheetTitle>
          </SheetHeader>
          <SidebarNav onNavigate={() => setMobileNavOpen(false)} />
        </SheetContent>
      </Sheet>

      <h1 className="text-sm font-semibold tracking-tight lg:text-base">{title}</h1>

      <div className="ml-auto flex items-center gap-2">
        <Button
          variant="outline"
          className="hidden w-44 justify-start gap-2 text-muted-foreground sm:flex"
          onClick={openCommandPalette}
        >
          <Search className="size-4" aria-hidden />
          Search
          <kbd className="ml-auto rounded border bg-muted px-1 font-sans text-[11px] text-muted-foreground">
            ⌘K
          </kbd>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="sm:hidden"
          aria-label="Search"
          onClick={openCommandPalette}
        >
          <Search />
        </Button>
        <ThemeToggle />
        <WalletPill />
      </div>
    </header>
  );
}
