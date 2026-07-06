"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatBaht } from "@/lib/denominations";

export interface DenomSlice {
  label: string;
  value: number;
  color: string;
}

export function DonutChartWrapper({ data }: { data: DenomSlice[] }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  if (data.length === 0 || total === 0) {
    return (
      <p className="rounded-2xl bg-brand-surface p-6 text-center text-sm text-brand-muted">
        Not enough data yet to show a denomination mix.
      </p>
    );
  }

  return (
    <div className="rounded-2xl border border-black/5 bg-brand-surface p-4">
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="label"
              innerRadius="60%"
              outerRadius="90%"
              paddingAngle={2}
              stroke="#ffffff"
              strokeWidth={2}
            >
              {data.map((slice) => (
                <Cell key={slice.label} fill={slice.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name) => [
                formatBaht(Number(value ?? 0)),
                String(name),
              ]}
              contentStyle={{
                borderRadius: 12,
                border: "1px solid rgba(11,11,11,0.08)",
                fontSize: 13,
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2">
        {data.map((slice) => (
          <li key={slice.label} className="flex items-center gap-2 text-xs">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: slice.color }}
            />
            <span className="flex-1 truncate text-brand-muted">
              {slice.label}
            </span>
            <span className="font-semibold text-brand-navy">
              {((slice.value / total) * 100).toFixed(0)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
