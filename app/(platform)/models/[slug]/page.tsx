import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CircleCheck } from "lucide-react";
import { MODELS, getModel } from "@/lib/data/models";
import { MODEL_PROVIDER_LABELS } from "@/lib/types";
import type { PassType } from "@/lib/types";
import { PASS_LABELS, formatCompact } from "@/lib/format";
import { LiveBadge } from "@/components/models/live-badge";
import { ModelCard } from "@/components/models/model-card";
import { ModelBillingCard } from "@/components/models/model-billing-card";
import { Badge } from "@/components/ui/badge";

export function generateStaticParams() {
  return MODELS.map((model) => ({ slug: model.slug }));
}

function isPassType(v: string | undefined): v is PassType {
  return Boolean(v && (Object.keys(PASS_LABELS) as string[]).includes(v));
}

export async function generateMetadata(
  props: PageProps<"/models/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const model = getModel(slug);
  if (!model) return { title: "Model not found" };
  return {
    title: model.name,
    description: model.tagline,
  };
}

export default async function ModelDetailPage(props: PageProps<"/models/[slug]">) {
  const { slug } = await props.params;
  const model = getModel(slug);
  if (!model) notFound();

  const searchParams = await props.searchParams;
  const buyParam = typeof searchParams.buy === "string" ? searchParams.buy : undefined;
  const initialBuyPass =
    isPassType(buyParam) && model.pricing.passes[buyParam] ? buyParam : undefined;

  const moreFromProvider = MODELS.filter(
    (m) => m.provider === model.provider && m.id !== model.id,
  ).slice(0, 3);

  return (
    <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
      <div className="flex min-w-0 flex-1 flex-col gap-6">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Badge variant="secondary">{MODEL_PROVIDER_LABELS[model.provider]}</Badge>
            {model.featured && (
              <Badge className="bg-brand-soft text-brand dark:text-sidebar-accent-foreground">
                Featured
              </Badge>
            )}
            <LiveBadge live={Boolean(model.liveModelId)} />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{model.name}</h1>
          <p className="mt-1.5 text-base text-muted-foreground">{model.tagline}</p>
          <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
            <span className="text-muted-foreground tabular-nums">
              {formatCompact(model.contextWindow)} token context window
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2 whitespace-pre-line text-sm leading-6 text-muted-foreground">
          {model.description.split("\n\n").map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>

        <div>
          <h2 className="mb-2 text-sm font-semibold tracking-tight">Capabilities</h2>
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {model.capabilities.map((cap) => (
              <li key={cap} className="flex items-start gap-2 text-sm">
                <CircleCheck className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
                {cap}
              </li>
            ))}
          </ul>
        </div>

        {moreFromProvider.length > 0 && (
          <div>
            <h2 className="mb-3 text-sm font-semibold tracking-tight">
              More from {MODEL_PROVIDER_LABELS[model.provider]}
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {moreFromProvider.map((m) => (
                <ModelCard key={m.id} model={m} />
              ))}
            </div>
          </div>
        )}

        <Link
          href="/models"
          className="inline-flex items-center gap-1 self-start text-sm text-muted-foreground hover:text-foreground hover:underline"
        >
          <ArrowRight className="size-3.5 rotate-180" aria-hidden />
          Back to models
        </Link>
      </div>

      <div className="w-full shrink-0 lg:sticky lg:top-20 lg:w-80">
        <ModelBillingCard model={model} initialBuyPass={initialBuyPass} />
      </div>
    </div>
  );
}
