"use client";

import { KeyRound } from "lucide-react";
import { formatRelative } from "@/lib/format";
import { getModelById } from "@/lib/data/models";
import { useAppStore } from "@/lib/store/app-store";
import type { ApiKey } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ApiKeyRow({ apiKey }: { apiKey: ApiKey }) {
  const revokeApiKey = useAppStore((s) => s.revokeApiKey);
  const model = apiKey.modelId ? getModelById(apiKey.modelId) : undefined;
  const revoked = apiKey.revokedAt != null;

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border bg-card p-4 shadow-card",
        revoked && "opacity-60",
      )}
    >
      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-lg",
          revoked ? "bg-muted text-muted-foreground" : "bg-brand-soft text-brand",
        )}
        aria-hidden
      >
        <KeyRound className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{apiKey.label}</p>
        <p className="truncate font-mono text-xs text-muted-foreground">
          jatah_sk_••••••••••••{apiKey.last4}
        </p>
      </div>
      <div className="hidden shrink-0 text-right text-xs text-muted-foreground sm:block">
        <p>{model ? model.name : "All models"}</p>
        <p>
          {apiKey.lastUsedAt
            ? `Used ${formatRelative(apiKey.lastUsedAt)}`
            : "Never used"}
        </p>
      </div>
      {revoked ? (
        <span className="shrink-0 text-xs text-muted-foreground">Revoked</span>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="shrink-0"
          onClick={() => revokeApiKey(apiKey.id)}
        >
          Revoke
        </Button>
      )}
    </div>
  );
}
