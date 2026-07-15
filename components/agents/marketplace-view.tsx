"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Search, SearchX } from "lucide-react";
import { AGENTS, CATEGORIES, CATEGORY_LABELS } from "@/lib/data/agents";
import { getCreator } from "@/lib/data/creators";
import type { Agent, Category } from "@/lib/types";
import { AgentCard } from "@/components/agents/agent-card";
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

type Sort = "rating" | "runs" | "price";
type CategoryFilter = Category | "all";

const SORT_LABELS: Record<Sort, string> = {
  rating: "Top rated",
  runs: "Most used",
  price: "Lowest price",
};

function minPrice(agent: Agent): number {
  if (agent.pricing.perRequest) return agent.pricing.perRequest.estMin;
  const passes = Object.values(agent.pricing.passes);
  return passes.length ? Math.min(...passes.map((p) => p.price)) : Infinity;
}

function isCategory(v: string | undefined): v is Category {
  return Boolean(v && (CATEGORIES as string[]).includes(v));
}

export function MarketplaceView({
  initialCategory,
  initialQuery,
}: {
  initialCategory?: string;
  initialQuery?: string;
}) {
  const pathname = usePathname();
  const [category, setCategory] = useState<CategoryFilter>(
    isCategory(initialCategory) ? initialCategory : "all",
  );
  const [query, setQuery] = useState(initialQuery ?? "");
  const [sort, setSort] = useState<Sort>("rating");
  const firstRender = useRef(true);

  // Keep filters deep-linkable without triggering server navigations.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const params = new URLSearchParams();
    if (category !== "all") params.set("category", category);
    if (query) params.set("q", query);
    const qs = params.toString();
    window.history.replaceState(null, "", qs ? `${pathname}?${qs}` : pathname);
  }, [category, query, pathname]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = AGENTS.filter((agent) => {
      if (category !== "all" && agent.category !== category) return false;
      if (!q) return true;
      const creator = getCreator(agent.creatorId);
      return [agent.name, agent.tagline, CATEGORY_LABELS[agent.category], creator?.name ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
    return list.sort((a, b) => {
      if (sort === "rating") return b.rating - a.rating || b.reviewsCount - a.reviewsCount;
      if (sort === "runs") return b.runsCount - a.runsCount;
      return minPrice(a) - minPrice(b);
    });
  }, [category, query, sort]);

  const featured = useMemo(
    () => AGENTS.filter((a) => a.featured),
    [],
  );
  const showFeatured = category === "all" && !query.trim();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">
          Find an agent. Pay your way.
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Every agent shows its price before it runs — per request with a hard cap, or
          covered by a time pass.
        </p>
      </div>

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
              placeholder="Search agents…"
              aria-label="Search agents"
              className="pl-8"
            />
          </div>
          <Select value={sort} onValueChange={(v) => setSort(v as Sort)}>
            <SelectTrigger className="w-40 sm:ml-auto" aria-label="Sort agents">
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

        <Tabs value={category} onValueChange={(v) => setCategory(v as CategoryFilter)}>
          <TabsList className="w-full justify-start overflow-x-auto sm:w-fit">
            <TabsTrigger value="all">All</TabsTrigger>
            {CATEGORIES.map((c) => (
              <TabsTrigger key={c} value={c}>
                {CATEGORY_LABELS[c]}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {showFeatured && (
        <section aria-label="Featured agents" className="flex flex-col gap-3">
          <h3 className="text-sm font-medium text-muted-foreground">Featured</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {featured.map((agent) => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
        </section>
      )}

      <section aria-label="All agents" className="flex flex-col gap-3">
        {showFeatured && (
          <h3 className="text-sm font-medium text-muted-foreground">All agents</h3>
        )}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-16 text-center">
            <SearchX className="size-6 text-muted-foreground" aria-hidden />
            <div>
              <p className="font-medium">No agents match</p>
              <p className="text-sm text-muted-foreground">
                Try a different search or clear the filters.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setQuery("");
                setCategory("all");
              }}
            >
              Clear filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((agent) => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
