/**
 * Server-only OpenRouter client for live model test calls.
 * Free-tier models only (slugs end in `:free`) — 50 requests/day, 20/min.
 * No SDK: one OpenAI-compatible endpoint covers every model family.
 */

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

/** Keeps a single test call small so the daily free quota survives a demo. */
const MAX_OUTPUT_TOKENS = 512;
const TIMEOUT_MS = 30_000;

export type OpenRouterErrorCode = "rate_limited" | "not_configured" | "upstream_error";

export class OpenRouterError extends Error {
  constructor(
    public code: OpenRouterErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "OpenRouterError";
  }
}

export interface LiveCallResult {
  text: string;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
}

export async function callModel({
  liveModelId,
  prompt,
}: {
  liveModelId: string;
  prompt: string;
}): Promise<LiveCallResult> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new OpenRouterError("not_configured", "OPENROUTER_API_KEY is not set");
  }

  const startedAt = Date.now();
  let res: Response;
  try {
    res = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: liveModelId,
        messages: [{ role: "user", content: prompt }],
        max_tokens: MAX_OUTPUT_TOKENS,
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    throw new OpenRouterError("upstream_error", "OpenRouter request failed or timed out");
  }

  if (res.status === 429) {
    throw new OpenRouterError("rate_limited", "Free-tier rate limit reached");
  }
  if (!res.ok) {
    throw new OpenRouterError("upstream_error", `OpenRouter responded ${res.status}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    usage?: { prompt_tokens?: number; completion_tokens?: number };
    error?: { message?: string };
  };

  const text = data.choices?.[0]?.message?.content;
  if (!text) {
    throw new OpenRouterError(
      "upstream_error",
      data.error?.message ?? "OpenRouter returned no completion",
    );
  }

  return {
    text,
    inputTokens: data.usage?.prompt_tokens ?? 0,
    outputTokens: data.usage?.completion_tokens ?? 0,
    latencyMs: Date.now() - startedAt,
  };
}
