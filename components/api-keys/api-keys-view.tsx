"use client";

import { useState } from "react";
import { KeyRound, Plus } from "lucide-react";
import { useAppStore, useHydrated } from "@/lib/store/app-store";
import { ApiKeyRow } from "@/components/api-keys/api-key-row";
import { CreateApiKeyDialog } from "@/components/api-keys/create-api-key-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function ApiKeysView() {
  const hydrated = useHydrated();
  const apiKeys = useAppStore((s) => s.apiKeys);
  const [createOpen, setCreateOpen] = useState(false);

  const active = apiKeys.filter((k) => k.revokedAt == null);
  const revoked = apiKeys.filter((k) => k.revokedAt != null);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <p className="max-w-2xl text-sm text-muted-foreground">
          API keys let you call models directly from your own code — scope one to a
          single model, or leave it open to call any model on the platform. Usage still
          bills through the same wallet, budgets, and receipts.
        </p>
        <Button onClick={() => setCreateOpen(true)} className="shrink-0">
          <Plus aria-hidden />
          Create key
        </Button>
      </div>

      {!hydrated ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : apiKeys.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed py-16 text-center">
          <KeyRound className="size-5 text-muted-foreground" aria-hidden />
          <p className="font-medium">No API keys yet</p>
          <p className="text-sm text-muted-foreground">
            Create one to start calling models from your own code.
          </p>
          <Button className="mt-2" onClick={() => setCreateOpen(true)}>
            <Plus aria-hidden />
            Create key
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {active.length > 0 && (
            <div className="flex flex-col gap-3">
              {active.map((key) => (
                <ApiKeyRow key={key.id} apiKey={key} />
              ))}
            </div>
          )}
          {revoked.length > 0 && (
            <div>
              <p className="mb-3 text-xs font-medium text-muted-foreground">Revoked</p>
              <div className="flex flex-col gap-3">
                {revoked.map((key) => (
                  <ApiKeyRow key={key.id} apiKey={key} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <CreateApiKeyDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
