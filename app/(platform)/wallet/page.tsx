import type { Metadata } from "next";
import { WalletView } from "@/components/wallet/wallet-view";

export const metadata: Metadata = {
  title: "Wallet",
  description: "Balance, time passes, and recent transactions.",
};

export default function WalletPage() {
  return <WalletView />;
}
