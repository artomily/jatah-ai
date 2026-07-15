import Link from "next/link";
import { getAgentsByCreator } from "@/lib/data/agents";
import type { Creator } from "@/lib/types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function CreatorCard({ creator }: { creator: Creator }) {
  const agentCount = getAgentsByCreator(creator.id).length;

  return (
    <Link
      href="/creator"
      className="flex items-center gap-3 rounded-xl border bg-card p-4 shadow-card transition-colors outline-none hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Avatar>
        <AvatarFallback className="bg-brand-soft text-sm font-medium text-brand dark:text-sidebar-accent-foreground">
          {creator.initials}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="truncate font-medium">{creator.name}</p>
        <p className="truncate text-xs text-muted-foreground">
          {creator.handle} · {agentCount} agent{agentCount === 1 ? "" : "s"}
        </p>
      </div>
    </Link>
  );
}
