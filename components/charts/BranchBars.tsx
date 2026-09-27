"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatBaht } from "@/lib/denominations";
import { AXIS_MUTED, GRIDLINE } from "@/lib/chartColors";

export interface BranchSeries {
  key: "b1" | "b2";
  name: string;
  color: string;
}

export interface BranchPoint {
  label: string;
  b1: number | null;
  b2: number | null;
}

function formatAxisValue(v: number) {
  if (v >= 1000) {
    const thousands = v / 1000;
    return `฿${thousands % 1 === 0 ? thousands : thousands.toFixed(1)}k`;
  }
  return `฿${Math.round(v)}`;
}

export default function Bars({
  data,
  series,
  round,
  stacked,
  xInterval,
}: {
  data: BranchPoint[];
  series: BranchSeries[];
  round?: boolean;
  stacked?: boolean;
  xInterval?: number;
}) {
  const stack = stacked && series.length > 1;
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 4, right: 4, left: -4, bottom: 0 }}
          barGap={2}
        >
          <CartesianGrid vertical={false} stroke={GRIDLINE} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: AXIS_MUTED }}
            axisLine={{ stroke: GRIDLINE }}
            tickLine={false}
            interval={xInterval ?? "preserveStartEnd"}
          />
          <YAxis
            tick={{ fontSize: 11, fill: AXIS_MUTED }}
            axisLine={false}
            tickLine={false}
            width={52}
            tickFormatter={formatAxisValue}
            allowDecimals={false}
          />
          <Tooltip
            formatter={(value, name) => [
              round
                ? `≈${formatBaht(Math.round(Number(value ?? 0)))}`
                : formatBaht(Number(value ?? 0)),
              String(name),
            ]}
            contentStyle={{
              borderRadius: 12,
              border: "1px solid rgba(11,11,11,0.08)",
              fontSize: 13,
            }}
          />
          {series.length > 1 && (
            <Legend
              wrapperStyle={{ fontSize: 12 }}
              iconType="circle"
              iconSize={8}
            />
          )}
          {series.map((s, i) => (
            <Bar
              key={s.key}
              dataKey={s.key}
              name={s.name}
              fill={s.color}
              stackId={stack ? "total" : undefined}
              // In a stack only the top segment gets rounded corners; a thin
              // surface-colored stroke keeps the segments visually separate.
              radius={!stack || i === series.length - 1 ? [3, 3, 0, 0] : 0}
              stroke={stack ? "#fbf7ee" : undefined}
              strokeWidth={stack ? 1 : 0}
              maxBarSize={20}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

