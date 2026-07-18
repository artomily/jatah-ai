"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { LogoMark } from "@/components/logo";
import { Button } from "@/components/ui/button";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/#models", label: "Models" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/#how-it-works", label: "Developers" },
  { href: "#", label: "Docs" },
  { href: "#", label: "FAQ" },
];

/**
 * Next.js's <Link> only runs its scroll-to-hash logic on an actual route
 * change — clicking a hash link while already on that route just updates
 * the URL without scrolling. Since this nav only ever renders on "/", every
 * hash link here is a same-page jump, so we scroll manually instead.
 */
function scrollToHash(href: string) {
  const hash = href.slice(href.indexOf("#"));
  if (hash.length <= 1) return false;
  const target = document.querySelector(hash);
  if (!target) return false;
  window.history.pushState(null, "", hash);
  target.scrollIntoView({ behavior: "smooth", block: "start" });
  return true;
}

export function MarketingNav() {
  const [open, setOpen] = useState(false);

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (!href.includes("#")) return;
    if (scrollToHash(href)) e.preventDefault();
  };

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-6 px-4 sm:px-8">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-lg font-semibold tracking-tight text-white outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <LogoMark inverted />
          <span>
            Jatah<span className="text-white/50"> Ai</span>
          </span>
        </Link>
        <nav aria-label="Main" className="ml-4 hidden items-center gap-6 text-sm md:flex">
          {LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              onClick={(e) => handleLinkClick(e, link.href)}
              className="text-white/60 transition-colors hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto hidden items-center gap-2 md:flex">
          <Button variant="ghost" className="text-white/70 hover:bg-white/10 hover:text-white" asChild>
            <Link href="/dashboard">Sign in</Link>
          </Button>
          <Button className="bg-white text-zinc-900 hover:bg-white/85" asChild>
            <Link href="/dashboard">Launch App</Link>
          </Button>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto text-white hover:bg-white/10 md:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <X /> : <Menu />}
        </Button>
      </div>
      {open && (
        <div className="border-t border-white/10 px-4 py-4 md:hidden">
          <nav aria-label="Mobile" className="flex flex-col gap-3 text-sm text-white/70">
            {LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={(e) => {
                  handleLinkClick(e, link.href);
                  setOpen(false);
                }}
                className="hover:text-white"
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-2 flex items-center gap-2">
              <Button
                variant="outline"
                className="flex-1 border-white/20 bg-transparent text-white hover:bg-white/10"
                asChild
              >
                <Link href="/dashboard">Sign in</Link>
              </Button>
              <Button className="flex-1 bg-white text-zinc-900 hover:bg-white/85" asChild>
                <Link href="/dashboard">Launch App</Link>
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
