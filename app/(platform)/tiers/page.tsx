import type { Metadata } from "next";
import { TIERS } from "@/lib/data/tiers";
import { TiersView } from "@/components/tiers/tiers-view";

export const metadata: Metadata = {
  title: "Tier Passes",
  description:
    "Bundle several models under one shared token budget — one price, one countdown.",
};

export default async function TiersPage(props: PageProps<"/tiers">) {
  const searchParams = await props.searchParams;
  const buyParam = typeof searchParams.buy === "string" ? searchParams.buy : undefined;
  const initialBuySlug = TIERS.some((t) => t.slug === buyParam) ? buyParam : undefined;

  return <TiersView initialBuySlug={initialBuySlug} />;
}
