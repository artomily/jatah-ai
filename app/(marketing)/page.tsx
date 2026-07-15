import type { Metadata } from "next";
import { CreatorsCta } from "@/components/marketing/creators-cta";
import { Hero } from "@/components/marketing/hero";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { ManifestoBand } from "@/components/marketing/manifesto-band";
import { PassTiers } from "@/components/marketing/pass-tiers";
import { PricingComparison } from "@/components/marketing/pricing-comparison";
import { SubscriptionTiers } from "@/components/marketing/subscription-tiers";

export const metadata: Metadata = {
  title: "Jatah Ai — The payment layer for AI agents",
};

export default function LandingPage() {
  return (
    <>
      <Hero />
      <ManifestoBand />
      <HowItWorks />
      <PricingComparison />
      <SubscriptionTiers />
      <PassTiers />
      <CreatorsCta />
    </>
  );
}
