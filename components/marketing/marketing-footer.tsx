import Link from "next/link";
import { Logo } from "@/components/logo";

const COLUMNS = [
  {
    heading: "Product",
    links: [
      { href: "/marketplace", label: "Marketplace" },
      { href: "/dashboard", label: "Dashboard" },
      { href: "/#pricing", label: "Pricing" },
    ],
  },
  {
    heading: "Build",
    links: [
      { href: "/creator", label: "Creator Studio" },
      { href: "/marketplace", label: "Submit an agent" },
    ],
  },
  {
    heading: "Company",
    links: [
      { href: "/", label: "About" },
      { href: "/", label: "Trust & safety" },
    ],
  },
];

export function MarketingFooter() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-14 sm:px-8 md:flex-row md:justify-between">
        <div className="max-w-xs">
          <Logo />
          <p className="mt-3 text-sm text-muted-foreground">
            The payment layer for AI agents. Humans pay by time. Machines pay by usage.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          {COLUMNS.map((col) => (
            <div key={col.heading}>
              <p className="text-sm font-medium">{col.heading}</p>
              <ul className="mt-3 flex flex-col gap-2">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t px-4 py-6 sm:px-8">
        <p className="mx-auto max-w-6xl text-xs text-muted-foreground">
          © {new Date().getFullYear()} Jatah Ai. Payments settle via x402. This is a demo
          product — no real charges occur.
        </p>
      </div>
    </footer>
  );
}
