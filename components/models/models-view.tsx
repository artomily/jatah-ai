"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Search, SearchX, Ticket, X } from "lucide-react";
import { MODELS, MODEL_PROVIDERS } from "@/lib/data/models";
import { MODEL_PROVIDER_LABELS } from "@/lib/types";
import type { ModelProvider, PassType } from "@/lib/types";
import { PASS_LABELS } from "@/lib/format";
import { ModelCard } from "@/components/models/model-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Sort = "price" | "context";
type ProviderFilter = ModelProvider | "all";

const SORT_LABELS: Record<Sort, string> = {
  price: "Lowest price",
  context: "Largest context",
};

function isProvider(v: string | undefined): v is ModelProvider {
  return Boolean(v && (MODEL_PROVIDERS as string[]).includes(v));
}

function isPassType(v: string | undefined): v is PassType {
  return Boolean(v && (Object.keys(PASS_LABELS) as string[]).includes(v));
}

export function ModelsView({
  initialProvider,
  initialQuery,
  initialPass,
}: {
  initialProvider?: string;
  initialQuery?: string;
  initialPass?: string;
}) {
  const pathname = usePathname();
  const [provider, setProvider] = useState<ProviderFilter>(
    isProvider(initialProvider) ? initialProvider : "all",
  );
  const [query, setQuery] = useState(initialQuery ?? "");
  const [sort, setSort] = useState<Sort>("price");
  const [pass, setPass] = useState<PassType | null>(
    isPassType(initialPass) ? initialPass : null,
  );
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const params = new URLSearchParams();
    if (provider !== "all") params.set("provider", provider);
    if (query) params.set("q", query);
    if (pass) params.set("pass", pass);
    const qs = params.toString();
    window.history.replaceState(null, "", qs ? `${pathname}?${qs}` : pathname);
  }, [provider, query, pass, pathname]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = MODELS.filter((model) => {
      if (provider !== "all" && model.provider !== provider) return false;
      if (!q) return true;
      return [model.name, model.tagline, MODEL_PROVIDER_LABELS[model.provider]]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
    return list.sort((a, b) => {
      if (pass) {
        const aPrice = a.pricing.passes[pass]?.price;
        const bPrice = b.pricing.passes[pass]?.price;
        if ((aPrice != null) !== (bPrice != null)) return aPrice != null ? -1 : 1;
        if (aPrice != null && bPrice != null) return aPrice - bPrice;
      }
      if (sort === "context") return b.contextWindow - a.contextWindow;
      return a.pricing.perRequest.estMin - b.pricing.perRequest.estMin;
    });
  }, [provider, query, sort, pass]);

  const featured = useMemo(() => MODELS.filter((m) => m.featured), []);
  const showFeatured = provider === "all" && !query.trim() && !pass;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">
          Call the model directly. Same transparent billing.
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Generate an API key and call any model from your own code — priced per
          request with a hard cap, or covered by a time pass.
        </p>
      </div>

      {pass && (
        <div className="flex items-center gap-2 rounded-xl border bg-brand-soft/40 px-4 py-3 text-sm">
          <Ticket
            className="size-4 shrink-0 text-brand dark:text-sidebar-accent-foreground"
            aria-hidden
          />
          <p className="flex-1">
            Picking a model for a {PASS_LABELS[pass]} — models that offer it are shown
            first.
          </p>
          <button
            type="button"
            onClick={() => setPass(null)}
            aria-label="Dismiss"
            className="rounded-md p-1 text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 sm:max-w-xs">
            <Search
              className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search models…"
              aria-label="Search models"
              className="pl-8"
            />
          </div>
          <Select value={sort} onValueChange={(v) => setSort(v as Sort)}>
            <SelectTrigger className="w-44 sm:ml-auto" aria-label="Sort models">
              <SelectValue>{SORT_LABELS[sort]}</SelectValue>
            </SelectTrigger>
            <SelectContent align="end">
              {(Object.keys(SORT_LABELS) as Sort[]).map((s) => (
                <SelectItem key={s} value={s}>
                  {SORT_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Tabs value={provider} onValueChange={(v) => setProvider(v as ProviderFilter)}>
          <TabsList className="w-full justify-start overflow-x-auto sm:w-fit">
            <TabsTrigger value="all">All</TabsTrigger>
            {MODEL_PROVIDERS.map((p) => (
              <TabsTrigger key={p} value={p}>
                {MODEL_PROVIDER_LABELS[p]}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {showFeatured && (
        <section aria-label="Featured models" className="flex flex-col gap-3">
          <h3 className="text-sm font-medium text-muted-foreground">Featured</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {featured.map((model) => (
              <ModelCard key={model.id} model={model} />
            ))}
          </div>
        </section>
      )}

      <section aria-label="All models" className="flex flex-col gap-3">
        {showFeatured && (
          <h3 className="text-sm font-medium text-muted-foreground">All models</h3>
        )}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-16 text-center">
            <SearchX className="size-6 text-muted-foreground" aria-hidden />
            <div>
              <p className="font-medium">No models match</p>
              <p className="text-sm text-muted-foreground">
                Try a different search or clear the filters.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setQuery("");
                setProvider("all");
              }}
            >
              Clear filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((model) => (
              <ModelCard key={model.id} model={model} highlightPass={pass ?? undefined} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
