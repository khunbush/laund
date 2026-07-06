"use client";

import { useState } from "react";
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

export interface PerSessionPoint {
  date: string;
  totalBaht: number;
}

export interface MonthlyPoint {
  month: string;
  total: number;
}

function formatShortDate(iso: string) {
  const d = new Date(`${iso}T00:00:00Z`);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

function formatAxisValue(v: number) {
  if (v >= 1000) {
    const thousands = v / 1000;
    return `฿${thousands % 1 === 0 ? thousands : thousands.toFixed(1)}k`;
  }
  return `฿${Math.round(v)}`;
}

function formatMonth(key: string) {
  const [year, month] = key.split("-");
  const d = new Date(Number(year), Number(month) - 1, 1);
  const monthLabel = d.toLocaleDateString("en-US", { month: "short" });
  return `${monthLabel} '${year.slice(-2)}`;
}

export function BarChartWrapper({
  perSession,
  monthly,
}: {
  perSession: PerSessionPoint[];
  monthly: MonthlyPoint[];
}) {
  const [view, setView] = useState<"session" | "monthly">("session");
  const hasData = perSession.length > 0;

  const data =
    view === "session"
      ? perSession.map((p) => ({ label: formatShortDate(p.date), value: p.totalBaht }))
      : monthly.map((m) => ({ label: formatMonth(m.month), value: m.total }));

  return (
    <div className="rounded-2xl border border-black/5 bg-brand-surface p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-brand-navy">
          {view === "session" ? "Per session" : "Monthly totals"}
        </h3>
        <div className="flex gap-1 rounded-full bg-black/5 p-1 text-xs font-medium">
          <button
            type="button"
            onClick={() => setView("session")}
            className={`rounded-full px-3 py-1 transition ${
              view === "session" ? "bg-white text-brand-navy shadow-sm" : "text-brand-muted"
            }`}
          >
            Sessions
          </button>
          <button
            type="button"
            onClick={() => setView("monthly")}
            className={`rounded-full px-3 py-1 transition ${
              view === "monthly" ? "bg-white text-brand-navy shadow-sm" : "text-brand-muted"
            }`}
          >
            Monthly
          </button>
        </div>
      </div>

      {!hasData ? (
        <p className="py-10 text-center text-sm text-brand-muted">
          No sessions yet.
        </p>
      ) : (
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
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
                width={48}
                tickFormatter={formatAxisValue}
                allowDecimals={false}
              />
              <Tooltip
                formatter={(value) => [formatBaht(Number(value ?? 0)), "Total"]}
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
      )}
    </div>
  );
}
