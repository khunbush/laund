import Link from "next/link";
import { getMonthlyReport } from "@/lib/data/reports";
import { getUnpaidSummary } from "@/lib/data/dashboard";
import { CalendarHeatmap } from "@/components/CalendarHeatmap";
import { StatCard } from "@/components/StatCard";
import { BottomTabBar } from "@/components/BottomTabBar";
import { UnpaidBanner } from "@/components/UnpaidBanner";
import { I18nProvider } from "@/components/I18nProvider";
import { formatBaht } from "@/lib/denominations";
import { KIND_EMOJI, type SessionKindValue } from "@/lib/kinds";
import { currentMonthIct } from "@/lib/ict";
import { dateLocale, KIND_KEYS, t, tn } from "@/lib/i18n";
import { getLang } from "@/lib/i18n-server";

// The Dashboard tab lands on the current month; the all-time summary lives one
// tap away at /dashboard/all-time. Dynamic because the page reads the language
// cookie and every session mutation revalidates this path.
export const dynamic = "force-dynamic";

const KIND_ORDER: SessionKindValue[] = ["LAUNDRY", "SNOOKER", "LUMP_SUM"];

function monthTitle(month: string, locale: string) {
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString(locale, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function formatDay(iso: string, locale: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString(locale, {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const lang = await getLang();
  const locale = dateLocale(lang);
  const { month: monthParam } = await searchParams;
  const month = /^\d{4}-\d{2}$/.test(monthParam ?? "")
    ? monthParam!
    : currentMonthIct();

  const [report, unpaid] = await Promise.all([
    getMonthlyReport(month),
    getUnpaidSummary(),
  ]);
  const [year, monthNum] = month.split("-").map(Number);
  const paidPct =
    report.total > 0 ? (report.paidTotal / report.total) * 100 : 0;

  return (
    <I18nProvider lang={lang}>
    <div className="flex min-h-screen flex-1 flex-col bg-background">
      <main className="safe-top mx-auto flex w-full max-w-md flex-1 flex-col gap-5 px-4 pt-6 pb-6">
        <div className="flex items-center justify-between px-1">
          <h1 className="text-xl font-bold text-brand-navy">
            {t(lang, "dashboard")}
          </h1>
          <Link
            href="/dashboard/all-time"
            prefetch={true}
            className="rounded-full bg-black/5 px-3.5 py-1.5 text-xs font-semibold text-brand-navy/70 transition active:scale-95"
          >
            {t(lang, "allTimeLink")}
          </Link>
        </div>

        <div className="flex items-center justify-between px-1">
          <Link
            href={`/dashboard?month=${report.prevMonth}`}
            className="rounded-full bg-black/5 px-3.5 py-1.5 text-sm font-bold text-brand-navy transition active:scale-95"
            aria-label={t(lang, "prevMonth")}
          >
            ‹
          </Link>
          <h2 className="text-lg font-bold text-brand-navy">
            {monthTitle(month, locale)}
          </h2>
          <Link
            href={`/dashboard?month=${report.nextMonth}`}
            className="rounded-full bg-black/5 px-3.5 py-1.5 text-sm font-bold text-brand-navy transition active:scale-95"
            aria-label={t(lang, "nextMonth")}
          >
            ›
          </Link>
        </div>

        <UnpaidBanner
          unpaidTotal={unpaid.unpaidTotal}
          unpaidCount={unpaid.unpaidCount}
        />

        {report.sessionCount === 0 ? (
          <p className="rounded-2xl bg-brand-surface p-6 text-center text-sm text-brand-muted">
            {t(lang, "noSessionsMonth", { month: monthTitle(month, locale) })}
          </p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                variant="navy"
                label={t(lang, "monthTotal")}
                value={formatBaht(report.total)}
                caption={`${tn(lang, "sessions", report.sessionCount)} · ${tn(lang, "days", report.dayCount)}`}
              />
              <StatCard
                variant={
                  report.pctChange === null
                    ? "white"
                    : report.pctChange >= 0
                      ? "purple"
                      : "orange"
                }
                label={t(lang, "vsLastMonth")}
                value={
                  report.pctChange === null
                    ? "—"
                    : `${report.pctChange >= 0 ? "+" : ""}${report.pctChange.toFixed(0)}%`
                }
                caption={
                  report.prevTotal > 0
                    ? t(lang, "lastMonthAmt", {
                        amt: formatBaht(report.prevTotal),
                      })
                    : t(lang, "noDataLastMonth")
                }
              />
              <StatCard
                variant="white"
                label={t(lang, "avgPerDay")}
                value={
                  report.averagePerDay ? formatBaht(report.averagePerDay) : "—"
                }
              />
              <StatCard
                variant="white"
                label={t(lang, "bestDayCard")}
                value={report.bestDay ? formatBaht(report.bestDay.totalBaht) : "—"}
                caption={
                  report.bestDay
                    ? formatDay(report.bestDay.date, locale)
                    : undefined
                }
              />
            </div>

            <section className="rounded-2xl border border-black/5 bg-brand-surface p-4">
              <h2 className="mb-3 text-sm font-semibold text-brand-navy">
                {t(lang, "byType")}
              </h2>
              <div className="flex flex-col gap-2.5">
                {KIND_ORDER.filter((k) => report.byKind[k] > 0).map((k) => (
                  <div key={k} className="flex items-center justify-between text-sm">
                    <span className="text-brand-muted">
                      {KIND_EMOJI[k]} {t(lang, KIND_KEYS[k])}
                    </span>
                    <span className="font-serif text-xl leading-5 font-normal text-brand-navy">
                      {formatBaht(report.byKind[k])}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-black/5 bg-brand-surface p-4">
              <h2 className="mb-3 text-sm font-semibold text-brand-navy">
                {t(lang, "paidVsUnpaid")}
              </h2>
              <div className="mb-2 flex h-3 overflow-hidden rounded-full bg-black/5">
                {report.paidTotal > 0 && (
                  <div
                    className="bg-brand-green"
                    style={{ width: `${paidPct}%` }}
                  />
                )}
                {report.unpaidTotal > 0 && (
                  <div
                    className="bg-brand-purple"
                    style={{ width: `${100 - paidPct}%` }}
                  />
                )}
              </div>
              <div className="flex justify-between text-xs font-medium">
                <span className="text-brand-green-dark">
                  {t(lang, "paidAmt", { amt: formatBaht(report.paidTotal) })}
                </span>
                <span className="text-brand-purple-dark">
                  {t(lang, "unpaidAmt", { amt: formatBaht(report.unpaidTotal) })}
                </span>
              </div>
            </section>

            <div>
              <h2 className="mb-2 px-1 text-sm font-semibold text-brand-navy">
                {t(lang, "collectionDays")}
              </h2>
              <CalendarHeatmap
                year={year}
                month={monthNum}
                dailyTotals={report.dailyTotals}
                lang={lang}
              />
            </div>
          </>
        )}
      </main>
      <BottomTabBar />
    </div>
    </I18nProvider>
  );
}
