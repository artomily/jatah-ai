"use client";

import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import { formatMoney } from "@/lib/format";
import type { DayBucket } from "@/lib/store/selectors";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

const chartConfig = {
  spend: { label: "Spend", color: "var(--chart-1)" },
} satisfies ChartConfig;

export function SpendAreaChart({
  data,
  compact = false,
}: {
  data: DayBucket[];
  compact?: boolean;
}) {
  const chartData = data.map((d) => ({
    label: new Date(d.day).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    spend: d.spend,
  }));

  return (
    <ChartContainer
      config={chartConfig}
      className={compact ? "aspect-auto h-16 w-full" : "aspect-auto h-64 w-full"}
    >
      <AreaChart data={chartData} margin={{ left: 0, right: 0, top: 4, bottom: 0 }}>
        <defs>
          <linearGradient id="spendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.35} />
            <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
          </linearGradient>
        </defs>
        {!compact && <CartesianGrid vertical={false} strokeDasharray="3 3" />}
        {!compact && (
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            minTickGap={24}
          />
        )}
        {!compact && (
          <ChartTooltip
            cursor={false}
            content={
              <ChartTooltipContent
                formatter={(value) => formatMoney(Number(value))}
                indicator="dot"
              />
            }
          />
        )}
        <Area
          dataKey="spend"
          type="monotone"
          fill="url(#spendFill)"
          stroke="var(--chart-1)"
          strokeWidth={2}
          isAnimationActive={false}
        />
      </AreaChart>
    </ChartContainer>
  );
}
