"use client";

import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import type { DayBucket } from "@/lib/store/selectors";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

const chartConfig = {
  runs: { label: "Runs", color: "var(--chart-2)" },
} satisfies ChartConfig;

export function RunsBarChart({ data }: { data: DayBucket[] }) {
  const chartData = data.map((d) => ({
    label: new Date(d.day).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    runs: d.runs,
  }));

  return (
    <ChartContainer config={chartConfig} className="aspect-auto h-56 w-full">
      <BarChart data={chartData} margin={{ left: 0, right: 0, top: 4, bottom: 0 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} minTickGap={24} />
        <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
        <Bar dataKey="runs" fill="var(--chart-2)" radius={4} isAnimationActive={false} />
      </BarChart>
    </ChartContainer>
  );
}
