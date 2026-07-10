"use client";

import { useState } from "react";
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

function formatShortDate(iso: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

function formatMonthLabel(key: string) {
  const [year, month] = key.split("-");
  const d = new Date(Date.UTC(Number(year), Number(month) - 1, 1));
  return `${d.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" })} '${year.slice(-2)}`;
}

function formatAxisValue(v: number) {
  if (v >= 1000) {
    const thousands = v / 1000;
    return `฿${thousands % 1 === 0 ? thousands : thousands.toFixed(1)}k`;
  }
  return `฿${Math.round(v)}`;
}

function Bars({
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
          margin={{ top: 4, right: 4, left: -16, bottom: 0 }}
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
            width={48}
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

/** Revenue over time with a Daily (selected month) / Monthly (all data) toggle. */
export function BranchTrendChart({
  series,
  daily,
  monthly,
  stacked,
}: {
  series: BranchSeries[];
  daily: { date: string; b1: number | null; b2: number | null }[];
  monthly: { month: string; b1: number | null; b2: number | null }[];
  stacked?: boolean;
}) {
  const [view, setView] = useState<"daily" | "monthly">("daily");

  const data: BranchPoint[] =
    view === "daily"
      ? daily.map((p) => ({ ...p, label: formatShortDate(p.date) }))
      : monthly.map((p) => ({ ...p, label: formatMonthLabel(p.month) }));

  return (
    <div className="rounded-2xl border border-black/5 bg-brand-surface p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-brand-navy">
          {view === "daily" ? "Daily revenue" : "Monthly revenue"}
        </h3>
        <div className="flex gap-1 rounded-full bg-black/5 p-1 text-xs font-medium">
          <button
            type="button"
            onClick={() => setView("daily")}
            className={`rounded-full px-3 py-1 transition ${
              view === "daily"
                ? "bg-white text-brand-navy shadow-sm"
                : "text-brand-muted"
            }`}
          >
            Daily
          </button>
          <button
            type="button"
            onClick={() => setView("monthly")}
            className={`rounded-full px-3 py-1 transition ${
              view === "monthly"
                ? "bg-white text-brand-navy shadow-sm"
                : "text-brand-muted"
            }`}
          >
            Monthly
          </button>
        </div>
      </div>
      {data.length === 0 ? (
        <p className="py-10 text-center text-sm text-brand-muted">
          No machine data {view === "daily" ? "this month" : "yet"}.
        </p>
      ) : (
        <Bars data={data} series={series} stacked={stacked} />
      )}
    </div>
  );
}

/** Average revenue by day of week, across all imported data. */
export function BranchWeekdayChart({
  series,
  weekday,
  stacked,
}: {
  series: BranchSeries[];
  weekday: { dow: string; b1: number | null; b2: number | null }[];
  stacked?: boolean;
}) {
  const hasData = weekday.some((w) =>
    series.some((s) => (w[s.key] ?? 0) > 0),
  );
  const data: BranchPoint[] = weekday.map((w) => ({ ...w, label: w.dow }));

  return (
    <div className="rounded-2xl border border-black/5 bg-brand-surface p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-brand-navy">
          Day of week — average
        </h3>
        <span className="text-[11px] text-brand-muted">all data</span>
      </div>
      {!hasData ? (
        <p className="py-10 text-center text-sm text-brand-muted">
          No machine data yet.
        </p>
      ) : (
        <Bars data={data} series={series} round stacked={stacked} />
      )}
    </div>
  );
}

/** Revenue by hour of day (ICT), summed over all stored transactions. */
export function BranchHourlyChart({
  series,
  hourly,
  since,
  stacked,
}: {
  series: BranchSeries[];
  hourly: { hour: string; b1: number | null; b2: number | null }[];
  since: string | null;
  stacked?: boolean;
}) {
  const hasData =
    since !== null &&
    hourly.some((h) => series.some((s) => (h[s.key] ?? 0) > 0));
  const data: BranchPoint[] = hourly.map((h) => ({ ...h, label: h.hour }));

  return (
    <div className="rounded-2xl border border-black/5 bg-brand-surface p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-brand-navy">Time of day</h3>
        {hasData && (
          <span className="text-[11px] text-brand-muted">
            since{" "}
            {new Date(`${since}T00:00:00Z`).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              timeZone: "UTC",
            })}
          </span>
        )}
      </div>
      {!hasData ? (
        <p className="py-10 text-center text-sm text-brand-muted">
          Hourly data builds up from each new daily upload — check back after
          the next one.
        </p>
      ) : (
        <Bars data={data} series={series} stacked={stacked} xInterval={2} />
      )}
    </div>
  );
}
