"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { dateLocale } from "@/lib/i18n";
import { useT } from "@/components/I18nProvider";

// Recharts loads as its own chunk so the page hydrates first; the placeholder
// matches the plot height so nothing shifts when it arrives.
const TotalBars = dynamic(() => import("@/components/charts/TotalBars"), {
  ssr: false,
  loading: () => <div className="h-56 w-full" />,
});

export interface DailyPoint {
  date: string;
  totalBaht: number;
}

export interface MonthlyPoint {
  month: string;
  total: number;
}

function formatShortDate(iso: string, locale: string) {
  const d = new Date(`${iso}T00:00:00Z`);
  return d.toLocaleDateString(locale, { month: "short", day: "numeric", timeZone: "UTC" });
}

function formatMonth(key: string, locale: string) {
  const [year, month] = key.split("-");
  const d = new Date(Number(year), Number(month) - 1, 1);
  const monthLabel = d.toLocaleDateString(locale, { month: "short" });
  return `${monthLabel} '${year.slice(-2)}`;
}

export function BarChartWrapper({
  daily,
  monthly,
}: {
  daily: DailyPoint[];
  monthly: MonthlyPoint[];
}) {
  const { lang, t } = useT();
  const locale = dateLocale(lang);
  const [view, setView] = useState<"daily" | "monthly">("daily");
  const hasData = daily.length > 0;

  const data =
    view === "daily"
      ? daily.map((p) => ({ label: formatShortDate(p.date, locale), value: p.totalBaht }))
      : monthly.map((m) => ({ label: formatMonth(m.month, locale), value: m.total }));

  return (
    <div className="rounded-2xl border border-black/5 bg-brand-surface p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-brand-navy">
          {view === "daily" ? t("perCollectionDay") : t("monthlyTotals")}
        </h3>
        <div className="flex gap-1 rounded-full bg-black/5 p-1 text-xs font-medium">
          <button
            type="button"
            onClick={() => setView("daily")}
            className={`rounded-full px-3 py-1 transition ${
              view === "daily" ? "bg-white text-brand-navy shadow-sm" : "text-brand-muted"
            }`}
          >
            {t("daily")}
          </button>
          <button
            type="button"
            onClick={() => setView("monthly")}
            className={`rounded-full px-3 py-1 transition ${
              view === "monthly" ? "bg-white text-brand-navy shadow-sm" : "text-brand-muted"
            }`}
          >
            {t("monthly")}
          </button>
        </div>
      </div>

      {!hasData ? (
        <p className="py-10 text-center text-sm text-brand-muted">
          {t("noSessionsYet")}
        </p>
      ) : (
        <TotalBars data={data} valueLabel={t("chartTotal")} />
      )}
    </div>
  );
}
