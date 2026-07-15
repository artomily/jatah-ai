import type { Metadata } from "next";
import { CreatorView } from "@/components/creator/creator-view";

export const metadata: Metadata = {
  title: "Creator Studio",
  description: "Earnings, agent performance, and billing model controls.",
};

export default function CreatorPage() {
  return <CreatorView />;
}
