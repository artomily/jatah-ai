import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CircleCheck, Zap } from "lucide-react";
import { AGENTS, CATEGORY_LABELS, getAgent } from "@/lib/data/agents";
import { getCreator } from "@/lib/data/creators";
import { formatCompact } from "@/lib/format";
import { AgentCard } from "@/components/agents/agent-card";
import { BillingOptionsCard } from "@/components/agents/billing-options-card";
import { CreatorCard } from "@/components/agents/creator-card";
import { ProviderChips } from "@/components/agents/provider-chips";
import { Rating } from "@/components/agents/rating-stars";
import { Badge } from "@/components/ui/badge";

export function generateStaticParams() {
  return AGENTS.map((agent) => ({ slug: agent.slug }));
}

export async function generateMetadata(
  props: PageProps<"/agents/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const agent = getAgent(slug);
  if (!agent) return { title: "Agent not found" };
  return {
    title: agent.name,
    description: agent.tagline,
  };
}

export default async function AgentDetailPage(props: PageProps<"/agents/[slug]">) {
  const { slug } = await props.params;
  const agent = getAgent(slug);
  if (!agent) notFound();

  const creator = getCreator(agent.creatorId);
  const moreFromCreator = AGENTS.filter(
    (a) => a.creatorId === agent.creatorId && a.id !== agent.id,
  ).slice(0, 3);

  return (
    <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
      <div className="flex min-w-0 flex-1 flex-col gap-6">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Badge variant="secondary">{CATEGORY_LABELS[agent.category]}</Badge>
            {agent.featured && (
              <Badge className="bg-brand-soft text-brand dark:text-sidebar-accent-foreground">
                Featured
              </Badge>
            )}
          </div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{agent.name}</h1>
          <p className="mt-1.5 text-base text-muted-foreground">{agent.tagline}</p>
          <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
            <Rating rating={agent.rating} reviewsCount={agent.reviewsCount} />
            <span className="flex items-center gap-1 text-muted-foreground tabular-nums">
              <Zap className="size-3.5" aria-hidden />
              {formatCompact(agent.runsCount)} runs
            </span>
            {creator && (
              <Link href="/creator" className="text-muted-foreground hover:text-foreground hover:underline">
                by {creator.name}
              </Link>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2 whitespace-pre-line text-sm leading-6 text-muted-foreground">
          {agent.description.split("\n\n").map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>

        <div>
          <h2 className="mb-2 text-sm font-semibold tracking-tight">Capabilities</h2>
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {agent.capabilities.map((cap) => (
              <li key={cap} className="flex items-start gap-2 text-sm">
                <CircleCheck className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
                {cap}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="mb-2 text-sm font-semibold tracking-tight">Providers used</h2>
          <ProviderChips providers={agent.providersUsed} />
        </div>

        {creator && (
          <div>
            <h2 className="mb-2 text-sm font-semibold tracking-tight">Creator</h2>
            <CreatorCard creator={creator} />
          </div>
        )}

        {moreFromCreator.length > 0 && creator && (
          <div>
            <h2 className="mb-3 text-sm font-semibold tracking-tight">
              More from {creator.name}
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {moreFromCreator.map((a) => (
                <AgentCard key={a.id} agent={a} />
              ))}
            </div>
          </div>
        )}

        <Link
          href="/marketplace"
          className="inline-flex items-center gap-1 self-start text-sm text-muted-foreground hover:text-foreground hover:underline"
        >
          <ArrowRight className="size-3.5 rotate-180" aria-hidden />
          Back to marketplace
        </Link>
      </div>

      <div className="w-full shrink-0 lg:sticky lg:top-20 lg:w-80">
        <BillingOptionsCard agent={agent} />
      </div>
    </div>
  );
}
