import { getModelById } from "@/lib/data/models";
import { OpenRouterError, callModel } from "@/lib/server/openrouter";

const MAX_PROMPT_CHARS = 2_000;

export async function POST(request: Request) {
  let body: { modelId?: unknown; prompt?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  const { modelId, prompt } = body;
  if (typeof modelId !== "string" || typeof prompt !== "string") {
    return Response.json({ error: "invalid_request" }, { status: 400 });
  }
  const trimmed = prompt.trim();
  if (!trimmed || trimmed.length > MAX_PROMPT_CHARS) {
    return Response.json({ error: "invalid_prompt" }, { status: 400 });
  }

  const model = getModelById(modelId);
  if (!model) {
    return Response.json({ error: "unknown_model" }, { status: 404 });
  }
  if (!model.liveModelId) {
    return Response.json({ error: "model_not_live" }, { status: 422 });
  }

  try {
    const result = await callModel({ liveModelId: model.liveModelId, prompt: trimmed });
    return Response.json({ ...result, liveModelId: model.liveModelId });
  } catch (err) {
    if (err instanceof OpenRouterError) {
      const status = err.code === "rate_limited" ? 429 : err.code === "not_configured" ? 503 : 502;
      return Response.json({ error: err.code }, { status });
    }
    return Response.json({ error: "upstream_error" }, { status: 502 });
  }
}
