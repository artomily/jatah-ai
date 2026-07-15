"use client";

import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import { formatMoney } from "@/lib/format";
import type { EarningsPoint } from "@/lib/data/creator";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";

const chartConfig = {
  usage: { label: "Usage", color: "var(--chart-1)" },
  passes: { label: "Passes", color: "var(--chart-2)" },
} satisfies ChartConfig;

export function EarningsAreaChart({ data }: { data: EarningsPoint[] }) {
  const chartData = data.map((d) => ({
    label: new Date(d.day).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    usage: d.usage,
    passes: d.passes,
  }));

  return (
    <ChartContainer config={chartConfig} className="aspect-auto h-64 w-full">
      <AreaChart data={chartData} margin={{ left: 0, right: 0, top: 4, bottom: 0 }}>
        <defs>
          <linearGradient id="usageFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.35} />
            <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="passesFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.35} />
            <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} minTickGap={32} />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent formatter={(value) => formatMoney(Number(value))} indicator="dot" />}
        />
        <Area
          dataKey="usage"
          type="monotone"
          stackId="1"
          fill="url(#usageFill)"
          stroke="var(--chart-1)"
          strokeWidth={2}
        />
        <Area
          dataKey="passes"
          type="monotone"
          stackId="1"
          fill="url(#passesFill)"
          stroke="var(--chart-2)"
          strokeWidth={2}
        />
        <ChartLegend content={<ChartLegendContent />} />
      </AreaChart>
    </ChartContainer>
  );
}
