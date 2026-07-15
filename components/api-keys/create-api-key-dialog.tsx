"use client";

import { useState } from "react";
import { Check, Copy, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { MODELS } from "@/lib/data/models";
import { useAppStore } from "@/lib/store/app-store";
import type { ApiKey } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function CreateApiKeyDialog({
  open,
  onOpenChange,
  defaultModelId = null,
  lockModel = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Preselects a model. */
  defaultModelId?: string | null;
  /** Hides the model picker — used when opened from a specific model's page. */
  lockModel?: boolean;
}) {
  const createApiKey = useAppStore((s) => s.createApiKey);
  const [label, setLabel] = useState("");
  const [modelId, setModelId] = useState(defaultModelId ?? "all");
  const [created, setCreated] = useState<ApiKey | null>(null);
  const [copied, setCopied] = useState(false);

  const lockedModel = lockModel ? MODELS.find((m) => m.id === defaultModelId) : undefined;

  const handleClose = (next: boolean) => {
    onOpenChange(next);
    if (!next) {
      setLabel("");
      setModelId(defaultModelId ?? "all");
      setCreated(null);
      setCopied(false);
    }
  };

  const handleCreate = () => {
    const key = createApiKey(modelId === "all" ? null : modelId, label);
    setCreated(key);
  };

  const handleCopy = async () => {
    if (!created) return;
    await navigator.clipboard.writeText(created.secret);
    setCopied(true);
    toast.success("Copied to clipboard");
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{created ? "Save your API key" : "Generate an API key"}</DialogTitle>
          <DialogDescription>
            {created
              ? "This is the only time the full key is shown — copy it now."
              : "Scope it to one model, or leave it open to call any model on the platform."}
          </DialogDescription>
        </DialogHeader>

        {created ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2.5 font-mono text-sm">
              <KeyRound className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              <code className="min-w-0 flex-1 truncate">{created.secret}</code>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Copy API key"
                onClick={handleCopy}
              >
                {copied ? (
                  <Check className="size-4 text-success" aria-hidden />
                ) : (
                  <Copy className="size-4" aria-hidden />
                )}
              </Button>
            </div>
            <p className="text-xs text-warning">
              You won&apos;t be able to see this key again after closing this dialog.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="key-label">Label</Label>
              <Input
                id="key-label"
                placeholder="e.g. Production, Local dev"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                autoComplete="off"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="key-model">Model</Label>
              {lockModel && lockedModel ? (
                <div className="flex h-9 items-center rounded-lg border bg-muted/40 px-3 text-sm text-muted-foreground">
                  {lockedModel.name}
                </div>
              ) : (
                <Select value={modelId} onValueChange={setModelId}>
                  <SelectTrigger id="key-model">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All models</SelectItem>
                    {MODELS.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          {created ? (
            <Button onClick={() => handleClose(false)}>Done</Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => handleClose(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate}>Generate key</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
