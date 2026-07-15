import { Logo } from "@/components/logo";
import { SidebarNav } from "@/components/shell/sidebar-nav";
import { Topbar } from "@/components/shell/topbar";

export function PlatformShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh w-full flex-1">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col gap-6 border-r bg-sidebar px-3 py-5 lg:flex">
        <Logo href="/marketplace" className="px-2.5" />
        <SidebarNav />
        <p className="px-2.5 text-xs leading-relaxed text-muted-foreground/70">
          Payments settle via x402.
          <br />
          Demo — no real charges.
        </p>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col lg:pl-60">
        <Topbar />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
