import type { Metadata } from "next";
import { TransactionsView } from "@/components/transactions/transactions-view";

export const metadata: Metadata = {
  title: "Transactions",
  description: "Every charge, pass purchase, and top-up — searchable and itemized.",
};

export default function TransactionsPage() {
  return <TransactionsView />;
}
