export type Provider =
  | "openai"
  | "anthropic"
  | "vision"
  | "search"
  | "embedding";

export type Category =
  | "research"
  | "coding"
  | "writing"
  | "data"
  | "vision"
  | "automation";

export type PassType = "pass_24h" | "pass_7d" | "pass_30d";

export type BillingModel = "perRequest" | PassType;

export interface PerRequestPricing {
  estMin: number;
  estMax: number;
  cap: number;
}

export interface AgentPricing {
  perRequest?: PerRequestPricing;
  passes: Partial<Record<PassType, { price: number }>>;
}

export interface Agent {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  category: Category;
  creatorId: string;
  rating: number;
  reviewsCount: number;
  runsCount: number;
  capabilities: string[];
  providersUsed: Provider[];
  avgExecutionMs: number;
  pricing: AgentPricing;
  featured?: boolean;
}

/** The company behind a raw model — distinct from `Provider`, which tags
 * subsystems (search/vision/embedding) an agent calls under the hood. */
export type ModelProvider = "openai" | "anthropic" | "google" | "meta" | "mistral";

export const MODEL_PROVIDER_LABELS: Record<ModelProvider, string> = {
  openai: "OpenAI",
  anthropic: "Anthropic",
  google: "Google",
  meta: "Meta",
  mistral: "Mistral",
};

export interface ModelRateCard {
  /** USD per 1M input tokens. */
  inputPerMillion: number;
  /** USD per 1M output tokens. */
  outputPerMillion: number;
}

export interface ModelPricing {
  /** Estimate + hard cap for a typical request — same shape and UX as agent
   * per-request pricing, so the estimate/approve/receipt flow is identical. */
  perRequest: PerRequestPricing;
  rateCard: ModelRateCard;
  passes: Partial<Record<PassType, { price: number }>>;
}

export interface AiModel {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  provider: ModelProvider;
  contextWindow: number;
  capabilities: string[];
  pricing: ModelPricing;
  featured?: boolean;
}

export interface ApiKey {
  id: string;
  label: string;
  /** null scope = valid for any model. */
  modelId: string | null;
  /** Full secret, only ever returned once at creation time by the store action. */
  secret: string;
  /** Last 4 chars of the secret, safe to keep around for display. */
  last4: string;
  createdAt: number;
  lastUsedAt: number | null;
  revokedAt: number | null;
}

export interface Creator {
  id: string;
  name: string;
  handle: string;
  bio: string;
  initials: string;
  joined: string;
}

/** Exactly one of `agentId` / `modelId` is set. */
export interface OwnedPass {
  id: string;
  agentId?: string;
  modelId?: string;
  type: PassType;
  price: number;
  activatedAt: number;
  expiresAt: number;
}

export type TransactionType = "usage" | "model_usage" | "pass_purchase" | "top_up";

export interface CostLine {
  provider: Provider | "input" | "output";
  label: string;
  amount: number;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  createdAt: number;
  /** Always positive; `type` gives the direction. */
  amount: number;
  agentId?: string;
  agentName?: string;
  modelId?: string;
  modelName?: string;
  taskPrompt?: string;
  breakdown?: CostLine[];
  executionMs?: number;
  estimate?: PerRequestPricing;
  /** model_usage only — raw token counts behind the breakdown lines. */
  inputTokens?: number;
  outputTokens?: number;
  /** Actual usage exceeded estMax; the user was charged the cap instead. */
  cappedOverrun?: boolean;
  /** Usage run with amount 0, covered by an active time pass. */
  coveredByPassId?: string;
  coveredByPassType?: PassType;
  passType?: PassType;
}

export type BudgetWindow = "daily" | "weekly" | "monthly";

export type Budgets = Record<BudgetWindow, number | null>;
