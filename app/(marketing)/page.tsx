import type { Metadata } from "next";
import { Faq } from "@/components/marketing/faq";
import { Hero } from "@/components/marketing/hero";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { ManifestoBand } from "@/components/marketing/manifesto-band";
import { PassTiers } from "@/components/marketing/pass-tiers";
import { PricingComparison } from "@/components/marketing/pricing-comparison";
import { SubscriptionTiers } from "@/components/marketing/subscription-tiers";
import { TryDemoBand } from "@/components/marketing/try-demo-band";

export const metadata: Metadata = {
  title: "Jatah Ai — The payment layer for AI models",
};

export default function LandingPage() {
  return (
    <>
      <Hero />
      <HowItWorks />
      <ManifestoBand />
      <PricingComparison />
      <SubscriptionTiers />
      <PassTiers />
      <Faq />
      <TryDemoBand />
    </>
  );
}
