"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { dateLocale, monthDay } from "@/lib/i18n";
import { useT } from "@/components/I18nProvider";
import type { BranchPoint, BranchSeries } from "@/components/charts/BranchBars";

export type { BranchPoint, BranchSeries };

// Recharts is the heaviest dependency in the app; loading it as its own chunk
// lets the page (stat cards, toggles) hydrate first. The placeholder has the
// plot's exact height so nothing shifts when the bars arrive.
const Bars = dynamic(() => import("@/components/charts/BranchBars"), {
  ssr: false,
  loading: () => <div className="h-56 w-full" />,
});

function formatShortDate(iso: string, locale: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

function formatMonthLabel(key: string, locale: string) {
  const [year, month] = key.split("-");
  const d = new Date(Date.UTC(Number(year), Number(month) - 1, 1));
  return `${d.toLocaleDateString(locale, { month: "short", timeZone: "UTC" })} '${year.slice(-2)}`;
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
  const { lang, t } = useT();
  const locale = dateLocale(lang);
  const [view, setView] = useState<"daily" | "monthly">("daily");

  const data: BranchPoint[] =
    view === "daily"
      ? daily.map((p) => ({ ...p, label: formatShortDate(p.date, locale) }))
      : monthly.map((p) => ({ ...p, label: formatMonthLabel(p.month, locale) }));

  return (
    <div className="rounded-2xl border border-black/5 bg-brand-surface p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-brand-navy">
          {view === "daily" ? t("dailyRevenue") : t("monthlyRevenue")}
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
            {t("daily")}
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
            {t("monthly")}
          </button>
        </div>
      </div>
      {data.length === 0 ? (
        <p className="py-10 text-center text-sm text-brand-muted">
          {view === "daily" ? t("noMachineThisMonth") : t("noMachineYet")}
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
  const { t } = useT();
  const hasData = weekday.some((w) =>
    series.some((s) => (w[s.key] ?? 0) > 0),
  );
  const data: BranchPoint[] = weekday.map((w) => ({ ...w, label: w.dow }));

  return (
    <div className="rounded-2xl border border-black/5 bg-brand-surface p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-brand-navy">
          {t("weekdayAvg")}
        </h3>
        <span className="text-[11px] text-brand-muted">{t("allData")}</span>
      </div>
      {!hasData ? (
        <p className="py-10 text-center text-sm text-brand-muted">
          {t("noMachineYet")}
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
  const { lang, t } = useT();
  const hasData =
    since !== null &&
    hourly.some((h) => series.some((s) => (h[s.key] ?? 0) > 0));
  const data: BranchPoint[] = hourly.map((h) => ({ ...h, label: h.hour }));

  return (
    <div className="rounded-2xl border border-black/5 bg-brand-surface p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-brand-navy">{t("timeOfDay")}</h3>
        {hasData && (
          <span className="text-[11px] text-brand-muted">
            {t("since", {
              date: monthDay(lang, new Date(`${since}T00:00:00Z`), true),
            })}
          </span>
        )}
      </div>
      {!hasData ? (
        <p className="py-10 text-center text-sm text-brand-muted">
          {t("hourlyEmpty")}
        </p>
      ) : (
        <Bars data={data} series={series} stacked={stacked} xInterval={2} />
      )}
    </div>
  );
}
