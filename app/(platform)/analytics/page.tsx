import type { Metadata } from "next";
import { AnalyticsView } from "@/components/analytics/analytics-view";

export const metadata: Metadata = {
  title: "Analytics",
  description: "Spend over time, by category, and by provider.",
};

export default function AnalyticsPage() {
  return <AnalyticsView />;
}
