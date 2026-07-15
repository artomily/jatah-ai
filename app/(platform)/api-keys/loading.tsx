import { Skeleton } from "@/components/ui/skeleton";

export default function ApiKeysLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <Skeleton className="h-10 w-full max-w-2xl" />
        <Skeleton className="h-9 w-32 shrink-0" />
      </div>
      <div className="flex flex-col gap-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
