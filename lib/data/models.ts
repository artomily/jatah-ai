import type { AiModel, ModelProvider } from "@/lib/types";

export const MODEL_PROVIDERS: ModelProvider[] = [
  "openai",
  "anthropic",
  "google",
  "meta",
  "mistral",
];

export const MODELS: AiModel[] = [
  {
    id: "model_gpt-5",
    slug: "gpt-5",
    name: "GPT-5",
    tagline: "OpenAI's flagship — strongest general reasoning and coding.",
    description:
      "GPT-5 is OpenAI's frontier model: strong at multi-step reasoning, long-context synthesis, and code generation across most mainstream languages. A solid default when you're not sure which model to reach for.\n\nBest for production workloads where quality matters more than raw speed or cost — complex agents, research synthesis, and code that needs to be right the first time.",
    provider: "openai",
    contextWindow: 400_000,
    capabilities: [
      "Multi-step reasoning and planning",
      "Strong code generation and review",
      "400K token context window",
      "Native tool/function calling",
      "Vision input support",
    ],
    pricing: {
      perRequest: { estMin: 0.04, estMax: 0.09, cap: 0.14 },
      rateCard: { inputPerMillion: 5, outputPerMillion: 15 },
      passes: {
        pass_24h: { price: 4 },
        pass_7d: { price: 14 },
        pass_30d: { price: 38 },
      },
    },
    featured: true,
  },
  {
    id: "model_gpt-5-mini",
    slug: "gpt-5-mini",
    name: "GPT-5 Mini",
    tagline: "Fast and cheap for high-volume, low-complexity calls.",
    description:
      "The lightweight sibling to GPT-5 — same context window, a fraction of the cost and latency. Loses some ceiling on hard reasoning tasks, but is more than enough for classification, extraction, short rewrites, and other high-volume utility calls.\n\nUsage-only: this one's priced for calling it thousands of times a day, not for buying a pass.",
    provider: "openai",
    contextWindow: 400_000,
    capabilities: [
      "Sub-second typical latency",
      "400K token context window",
      "Strong at classification and extraction",
      "Native tool/function calling",
    ],
    pricing: {
      perRequest: { estMin: 0.01, estMax: 0.02, cap: 0.03 },
      rateCard: { inputPerMillion: 0.6, outputPerMillion: 2.4 },
      passes: {},
    },
  },
  {
    id: "model_claude-opus-4-8",
    slug: "claude-opus-4-8",
    name: "Claude Opus 4.8",
    tagline: "Anthropic's deepest reasoning model.",
    description:
      "Opus 4.8 is Anthropic's most capable model — built for the hardest reasoning, the longest documents, and the code changes you don't want to review twice. It's slower and pricier than Sonnet, and worth it when correctness is the whole point.\n\nA 500K context window means it can hold an entire mid-size codebase or a full research corpus in a single call.",
    provider: "anthropic",
    contextWindow: 500_000,
    capabilities: [
      "Frontier-level reasoning and analysis",
      "500K token context window",
      "Careful, low-hallucination long-form writing",
      "Strong at large-codebase refactors",
      "Extended thinking mode",
    ],
    pricing: {
      perRequest: { estMin: 0.06, estMax: 0.12, cap: 0.18 },
      rateCard: { inputPerMillion: 8, outputPerMillion: 32 },
      passes: {
        pass_7d: { price: 18 },
        pass_30d: { price: 48 },
      },
    },
    featured: true,
  },
  {
    id: "model_claude-sonnet-5",
    slug: "claude-sonnet-5",
    name: "Claude Sonnet 5",
    tagline: "The balanced default — most teams should start here.",
    description:
      "Sonnet 5 is Anthropic's mid-tier model: close to Opus on most everyday tasks at a third of the cost, with noticeably better latency. It's the model most agents on this platform are actually built on.\n\nGood at code, good at writing, good at following detailed instructions without drifting.",
    provider: "anthropic",
    contextWindow: 500_000,
    capabilities: [
      "Strong reasoning at practical latency",
      "500K token context window",
      "Reliable instruction-following",
      "Solid code generation and review",
      "Vision input support",
    ],
    pricing: {
      perRequest: { estMin: 0.03, estMax: 0.06, cap: 0.09 },
      rateCard: { inputPerMillion: 3, outputPerMillion: 12 },
      passes: {
        pass_24h: { price: 3 },
        pass_7d: { price: 10 },
        pass_30d: { price: 26 },
      },
    },
    featured: true,
  },
  {
    id: "model_claude-haiku-4-5",
    slug: "claude-haiku-4-5",
    name: "Claude Haiku 4.5",
    tagline: "Anthropic's fast tier — near-instant, still capable.",
    description:
      "Haiku 4.5 trades some depth for speed and cost, but it's sharper than most \"fast tier\" models — still solid at summarization, tagging, and short-form writing where you're calling it constantly rather than occasionally.\n\nA 300K context window covers most real-world documents without needing to chunk them.",
    provider: "anthropic",
    contextWindow: 300_000,
    capabilities: [
      "Near-instant typical latency",
      "300K token context window",
      "Strong at summarization and tagging",
      "Cost-efficient for high call volumes",
    ],
    pricing: {
      perRequest: { estMin: 0.008, estMax: 0.015, cap: 0.02 },
      rateCard: { inputPerMillion: 0.5, outputPerMillion: 2 },
      passes: {
        pass_24h: { price: 1 },
      },
    },
  },
  {
    id: "model_gemini-2-5-pro",
    slug: "gemini-2-5-pro",
    name: "Gemini 2.5 Pro",
    tagline: "Google's largest context window — 1M tokens.",
    description:
      "Gemini 2.5 Pro's headline feature is scale: a full 1M token context window, enough to hold hours of transcript or an entire large repository in one pass. Reasoning quality sits just behind the top tier, but nothing else on this list holds this much context at once.\n\nStrong native multimodal support — text, images, and video frames in the same call.",
    provider: "google",
    contextWindow: 1_000_000,
    capabilities: [
      "1M token context window",
      "Native multimodal input (text, image, video)",
      "Strong long-document reasoning",
      "Competitive code generation",
      "Native tool/function calling",
    ],
    pricing: {
      perRequest: { estMin: 0.03, estMax: 0.07, cap: 0.1 },
      rateCard: { inputPerMillion: 2.5, outputPerMillion: 10 },
      passes: {
        pass_7d: { price: 9 },
        pass_30d: { price: 24 },
      },
    },
    featured: true,
  },
  {
    id: "model_llama-4-maverick",
    slug: "llama-4-maverick",
    name: "Llama 4 Maverick",
    tagline: "Open-weight, priced accordingly.",
    description:
      "Meta's open-weight flagship, served here so you don't have to host it yourself. Solid all-rounder for text tasks at a price closer to the budget tier than the frontier tier — a good fit when you're calling it often and don't need the absolute best reasoning.\n\nNo native vision input on this endpoint.",
    provider: "meta",
    contextWindow: 256_000,
    capabilities: [
      "256K token context window",
      "Open-weight model, competitively priced",
      "Solid general-purpose text generation",
      "Native tool/function calling",
    ],
    pricing: {
      perRequest: { estMin: 0.015, estMax: 0.03, cap: 0.045 },
      rateCard: { inputPerMillion: 1, outputPerMillion: 3 },
      passes: {
        pass_30d: { price: 14 },
      },
    },
  },
  {
    id: "model_mistral-large-3",
    slug: "mistral-large-3",
    name: "Mistral Large 3",
    tagline: "Efficient European alternative, strong at code.",
    description:
      "Mistral Large 3 punches above its price point, particularly on code generation and structured output. Latency is consistently low, which makes it a good fit for interactive tools rather than long batch jobs.\n\nContext window is smaller than the others here — fine for single files and short documents, less so for whole-repo analysis.",
    provider: "mistral",
    contextWindow: 200_000,
    capabilities: [
      "200K token context window",
      "Strong code generation for the price",
      "Low, consistent latency",
      "Reliable structured/JSON output",
    ],
    pricing: {
      perRequest: { estMin: 0.02, estMax: 0.04, cap: 0.06 },
      rateCard: { inputPerMillion: 2, outputPerMillion: 6 },
      passes: {
        pass_7d: { price: 8 },
      },
    },
  },
];

export function getModel(slug: string): AiModel | undefined {
  return MODELS.find((m) => m.slug === slug);
}

export function getModelById(id: string): AiModel | undefined {
  return MODELS.find((m) => m.id === id);
}
