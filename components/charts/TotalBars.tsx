"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatBaht } from "@/lib/denominations";
import { AXIS_MUTED, GRIDLINE, SEQUENTIAL_BAR_COLOR } from "@/lib/chartColors";

function formatAxisValue(v: number) {
  if (v >= 1000) {
    const thousands = v / 1000;
    return `฿${thousands % 1 === 0 ? thousands : thousands.toFixed(1)}k`;
  }
  return `฿${Math.round(v)}`;
}

export default function TotalBars({
  data,
  valueLabel,
}: {
  data: { label: string; value: number }[];
  valueLabel: string;
}) {
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 4, left: -4, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke={GRIDLINE} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: AXIS_MUTED }}
            axisLine={{ stroke: GRIDLINE }}
            tickLine={false}
            interval="preserveStartEnd"
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
            formatter={(value) => [formatBaht(Number(value ?? 0)), valueLabel]}
            contentStyle={{
              borderRadius: 12,
              border: "1px solid rgba(11,11,11,0.08)",
              fontSize: 13,
            }}
          />
          <Bar
            dataKey="value"
            fill={SEQUENTIAL_BAR_COLOR}
            radius={[4, 4, 0, 0]}
            maxBarSize={28}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
