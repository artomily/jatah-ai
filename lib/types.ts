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

export interface Creator {
  id: string;
  name: string;
  handle: string;
  bio: string;
  initials: string;
  joined: string;
}

export interface OwnedPass {
  id: string;
  agentId: string;
  type: PassType;
  price: number;
  activatedAt: number;
  expiresAt: number;
}

export type TransactionType = "usage" | "pass_purchase" | "top_up";

export interface CostLine {
  provider: Provider;
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
  taskPrompt?: string;
  breakdown?: CostLine[];
  executionMs?: number;
  estimate?: PerRequestPricing;
  /** Actual usage exceeded estMax; the user was charged the cap instead. */
  cappedOverrun?: boolean;
  /** Usage run with amount 0, covered by an active time pass. */
  coveredByPassId?: string;
  coveredByPassType?: PassType;
  passType?: PassType;
}

export type BudgetWindow = "daily" | "weekly" | "monthly";

export type Budgets = Record<BudgetWindow, number | null>;
