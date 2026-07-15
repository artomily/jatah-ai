import type { Metadata } from "next";
import { BudgetsView } from "@/components/budgets/budgets-view";

export const metadata: Metadata = {
  title: "Budgets",
  description: "Daily, weekly, and monthly spending caps with confirmation before overage.",
};

export default function BudgetsPage() {
  return <BudgetsView />;
}
