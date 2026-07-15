import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import { CommandPalette } from "@/components/command-palette";
import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/sonner";
import { TopUpDialog } from "@/components/wallet/top-up-dialog";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Jatah Ai — The payment layer for AI agents",
    template: "%s · Jatah Ai",
  },
  description:
    "Pay by time, pay by usage, settled instantly with x402. Pay per request with a hard cap, or unlock time passes — 24 hours, 7 days, 30 days. Humans pay by time. Machines pay by usage.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <Providers>
          {children}
          <CommandPalette />
          <TopUpDialog />
          <Toaster position="bottom-right" />
        </Providers>
      </body>
    </html>
  );
}
