import type { Provider } from "@/lib/types";

export interface ProviderMeta {
  label: string;
  receiptLabel: string;
  /** Maps to --chart-N token for consistent data-viz coloring. */
  chartVar: string;
}

export const PROVIDER_META: Record<Provider, ProviderMeta> = {
  openai: {
    label: "OpenAI",
    receiptLabel: "OpenAI · GPT-5 tokens",
    chartVar: "var(--chart-1)",
  },
  anthropic: {
    label: "Claude",
    receiptLabel: "Claude · reasoning tokens",
    chartVar: "var(--chart-2)",
  },
  vision: {
    label: "Vision",
    receiptLabel: "Vision · image analysis",
    chartVar: "var(--chart-3)",
  },
  search: {
    label: "Search",
    receiptLabel: "Search · web queries",
    chartVar: "var(--chart-4)",
  },
  embedding: {
    label: "Embedding",
    receiptLabel: "Embeddings · vector ops",
    chartVar: "var(--chart-5)",
  },
};

export const PROVIDERS: Provider[] = [
  "openai",
  "anthropic",
  "vision",
  "search",
  "embedding",
];
