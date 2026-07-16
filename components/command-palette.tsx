"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Blocks,
  ChartNoAxesColumn,
  Cpu,
  Gauge,
  KeyRound,
  LayoutDashboard,
  Moon,
  Plus,
  ReceiptText,
  RotateCcw,
  Sun,
  Wallet,
} from "lucide-react";
import { useTheme } from "next-themes";
import { MODELS } from "@/lib/data/models";
import { MODEL_PROVIDER_LABELS } from "@/lib/types";
import { useAppStore } from "@/lib/store/app-store";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";

const OPEN_EVENT = "jatah:open-palette";

export function openCommandPalette() {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

const PAGES = [
  { href: "/models", label: "Models", icon: Cpu },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/wallet", label: "Wallet", icon: Wallet },
  { href: "/transactions", label: "Transactions", icon: ReceiptText },
  { href: "/analytics", label: "Analytics", icon: ChartNoAxesColumn },
  { href: "/budgets", label: "Budgets", icon: Gauge },
  { href: "/api-keys", label: "API Keys", icon: KeyRound },
  { href: "/creator", label: "Creator Studio", icon: Blocks },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { setTheme, resolvedTheme } = useTheme();
  const resetDemo = useAppStore((s) => s.resetDemo);
  const setTopUpOpen = useAppStore((s) => s.setTopUpOpen);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(OPEN_EVENT, onOpen);
    };
  }, []);

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="Command palette"
      description="Jump to a page, find a model, or run an action"
    >
      <Command>
        <CommandInput placeholder="Search pages, models, actions…" />
        <CommandList>
          <CommandEmpty>No results.</CommandEmpty>
          <CommandGroup heading="Pages">
            {PAGES.map((page) => (
              <CommandItem key={page.href} onSelect={() => go(page.href)}>
                <page.icon aria-hidden />
                {page.label}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Models">
            {MODELS.map((model) => (
              <CommandItem
                key={model.id}
                value={`${model.name} ${model.tagline} ${MODEL_PROVIDER_LABELS[model.provider]}`}
                onSelect={() => go(`/models/${model.slug}`)}
              >
                <Cpu aria-hidden />
                {model.name}
                <span className="truncate text-xs text-muted-foreground">
                  {MODEL_PROVIDER_LABELS[model.provider]}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Actions">
            <CommandItem
              onSelect={() => {
                setOpen(false);
                setTopUpOpen(true);
              }}
            >
              <Plus aria-hidden />
              Top up wallet
            </CommandItem>
            <CommandItem onSelect={() => go("/api-keys")}>
              <KeyRound aria-hidden />
              Generate API key
            </CommandItem>
            <CommandItem
              onSelect={() => {
                setTheme(resolvedTheme === "dark" ? "light" : "dark");
                setOpen(false);
              }}
            >
              {resolvedTheme === "dark" ? <Sun aria-hidden /> : <Moon aria-hidden />}
              Toggle theme
            </CommandItem>
            <CommandItem
              onSelect={() => {
                resetDemo();
                setOpen(false);
              }}
            >
              <RotateCcw aria-hidden />
              Reset demo data
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
