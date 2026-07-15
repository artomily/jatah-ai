"use client";

import { Cell, Pie, PieChart } from "recharts";
import { CATEGORY_LABELS } from "@/lib/data/agents";
import { formatMoney } from "@/lib/format";
import type { Category } from "@/lib/types";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

const COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

export function CategoryDonut({
  data,
}: {
  data: Array<{ category: Category; spend: number }>;
}) {
  if (data.length === 0) {
    return (
      <div className="flex h-56 items-center justify-center text-sm text-muted-foreground">
        No spend yet
      </div>
    );
  }

  const chartConfig = Object.fromEntries(
    data.map((d, i) => [
      d.category,
      { label: CATEGORY_LABELS[d.category], color: COLORS[i % COLORS.length] },
    ]),
  ) satisfies ChartConfig;

  return (
    <ChartContainer config={chartConfig} className="mx-auto aspect-square h-56">
      <PieChart>
        <ChartTooltip
          content={<ChartTooltipContent formatter={(value) => formatMoney(Number(value))} hideLabel />}
        />
        <Pie
          data={data}
          dataKey="spend"
          nameKey="category"
          innerRadius={55}
          outerRadius={90}
          strokeWidth={2}
        >
          {data.map((d, i) => (
            <Cell key={d.category} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
      </PieChart>
    </ChartContainer>
  );
}
