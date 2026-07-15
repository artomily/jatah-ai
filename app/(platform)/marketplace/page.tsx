import type { Metadata } from "next";
import { MarketplaceView } from "@/components/agents/marketplace-view";

export const metadata: Metadata = {
  title: "Marketplace",
  description:
    "Browse AI agents with transparent pricing — pay per request with a hard cap, or unlock a time pass.",
};

export default async function MarketplacePage(props: PageProps<"/marketplace">) {
  const searchParams = await props.searchParams;
  const category =
    typeof searchParams.category === "string" ? searchParams.category : undefined;
  const q = typeof searchParams.q === "string" ? searchParams.q : undefined;

  return <MarketplaceView initialCategory={category} initialQuery={q} />;
}
