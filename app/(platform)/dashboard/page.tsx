import type { Metadata } from "next";
import { DashboardView } from "@/components/dashboard/dashboard-view";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Today's spending, budget remaining, and your most used agents.",
};

export default function DashboardPage() {
  return <DashboardView />;
}
