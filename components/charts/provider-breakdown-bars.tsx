"use client";

import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";
import { PROVIDER_META } from "@/lib/data/providers";
import { formatMoney } from "@/lib/format";
import type { Provider } from "@/lib/types";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

export function ProviderBreakdownBars({
  data,
}: {
  data: Array<{ provider: Provider; spend: number }>;
}) {
  if (data.length === 0) {
    return (
      <div className="flex h-56 items-center justify-center text-sm text-muted-foreground">
        No usage charges yet
      </div>
    );
  }

  const chartConfig = {
    spend: { label: "Spend", color: "var(--chart-1)" },
  } satisfies ChartConfig;

  const chartData = data.map((d) => ({
    label: PROVIDER_META[d.provider].label,
    spend: d.spend,
    fill: PROVIDER_META[d.provider].chartVar,
  }));

  return (
    <ChartContainer config={chartConfig} className="aspect-auto h-56 w-full">
      <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 12 }}>
        <CartesianGrid horizontal={false} strokeDasharray="3 3" />
        <XAxis type="number" tickLine={false} axisLine={false} hide />
        <YAxis
          type="category"
          dataKey="label"
          tickLine={false}
          axisLine={false}
          width={90}
        />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent formatter={(value) => formatMoney(Number(value))} hideLabel />}
        />
        <Bar dataKey="spend" radius={4} isAnimationActive={false}>
          {chartData.map((d) => (
            <Cell key={d.label} fill={d.fill} />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
