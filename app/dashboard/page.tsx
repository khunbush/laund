import {
  getDashboardStats,
  getProjections,
  getUnpaidSummary,
} from "@/lib/data/dashboard";
import { getRecentSessions } from "@/lib/data/sessions";
import { StatCard } from "@/components/StatCard";
import { BarChartWrapper } from "@/components/BarChartWrapper";
import { DonutChartWrapper } from "@/components/DonutChartWrapper";
import { SessionsTable } from "@/components/SessionsTable";
import { BottomTabBar } from "@/components/BottomTabBar";
import { UnpaidBanner } from "@/components/UnpaidBanner";
import { CalendarHeatmap } from "@/components/CalendarHeatmap";
import { formatBaht } from "@/lib/denominations";
import Link from "next/link";
import { ictNow } from "@/lib/ict";
import { I18nProvider } from "@/components/I18nProvider";
import { dateLocale, t, tn, weekdayLabel, type MsgKey } from "@/lib/i18n";
import { getLang } from "@/lib/i18n-server";

// Dynamic: the page reads the language cookie, which opts out of static /
// ISR rendering anyway. Time-relative stats like "Days Since Last" also stay
// live this way, and every mutation still calls revalidatePath("/dashboard").
export const dynamic = "force-dynamic";

const CONFIDENCE_KEY: Record<string, MsgKey> = {
  none: "confNone",
  low: "confLow",
  ok: "confOk",
};

function formatDate(date: Date | null, locale: string) {
  if (!date) return "—";
  return date.toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

function formatMonth(key: string, locale: string) {
  const [y, m] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString(locale, {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default async function DashboardPage() {
  const lang = await getLang();
  const locale = dateLocale(lang);
  const [stats, projections, recentSessions, unpaid] = await Promise.all([
    getDashboardStats(),
    getProjections(),
    getRecentSessions(8),
    getUnpaidSummary(),
  ]);

  // Thailand's "now" — read with UTC getters (see lib/ict.ts).
  const now = ictNow();

  return (
    <I18nProvider lang={lang}>
    <div className="flex min-h-screen flex-1 flex-col bg-background">
      <main className="safe-top mx-auto flex w-full max-w-md flex-1 flex-col gap-5 px-4 pt-6 pb-6">
        <div className="flex items-center justify-between px-1">
          <h1 className="text-xl font-bold text-brand-navy">{t(lang, "dashboard")}</h1>
          <Link
            href="/report"
            prefetch={true}
            className="rounded-full bg-black/5 px-3.5 py-1.5 text-xs font-semibold text-brand-navy/70 transition active:scale-95"
          >
            {t(lang, "monthlyReport")}
          </Link>
        </div>

        <UnpaidBanner
          unpaidTotal={unpaid.unpaidTotal}
          unpaidCount={unpaid.unpaidCount}
        />

        <div className="grid grid-cols-2 gap-3">
          <StatCard
            variant="navy"
            label={t(lang, "totalCollected")}
            value={formatBaht(stats.totalCollected)}
            caption={tn(lang, "sessions", stats.sessionCount)}
          />
          <StatCard
            variant="purple"
            label={t(lang, "avgPerCollectionDay")}
            value={stats.averagePerDay ? formatBaht(stats.averagePerDay) : "—"}
            caption={tn(lang, "days", stats.dayCount)}
          />
          <StatCard
            variant={
              stats.daysSinceLastCollection !== null && stats.daysSinceLastCollection >= 3
                ? "orange"
                : "white"
            }
            label={t(lang, "daysSinceLast")}
            value={
              stats.daysSinceLastCollection !== null
                ? t(lang, "dShort", { n: stats.daysSinceLastCollection })
                : "—"
            }
            caption={formatDate(stats.lastCollectionDate, locale)}
          />
          <StatCard
            variant="white"
            label={t(lang, "avgInterval")}
            value={
              stats.averageDaysBetweenCollections
                ? t(lang, "dShort", {
                    n: stats.averageDaysBetweenCollections.toFixed(1),
                  })
                : "—"
            }
          />
        </div>

        <section className="rounded-2xl border border-black/5 bg-brand-surface p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-brand-navy">{t(lang, "projections")}</h2>
            <span className="rounded-full bg-black/5 px-2.5 py-1 text-[11px] font-medium text-brand-muted">
              {t(lang, CONFIDENCE_KEY[projections.confidence])}
            </span>
          </div>
          {projections.confidence === "none" ? (
            <p className="text-sm text-brand-muted">
              {t(lang, "logMoreSessions")}
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-brand-muted">{t(lang, "projectedNext")}</p>
                <p className="font-serif text-2xl leading-7 font-normal text-brand-purple-dark">
                  {formatBaht(projections.projectedNextSessionAmount ?? 0)}
                </p>
                <p className="text-xs text-brand-muted">
                  ~{formatDate(projections.projectedNextSessionDate, locale)}
                </p>
              </div>
              <div>
                <p className="text-xs text-brand-muted">{t(lang, "projectedMonthEnd")}</p>
                <p className="font-serif text-2xl leading-7 font-normal text-brand-orange-dark">
                  {formatBaht(projections.projectedMonthEndTotal)}
                </p>
                <p className="text-xs text-brand-muted">
                  {t(lang, "soFar", {
                    amt: formatBaht(projections.actualCollectedThisMonth),
                  })}
                </p>
              </div>
            </div>
          )}
        </section>

        <BarChartWrapper
          daily={stats.dailySeries}
          monthly={stats.monthlyTotals}
        />

        <div>
          <h2 className="mb-2 px-1 text-sm font-semibold text-brand-navy">
            {t(lang, "thisMonth")}
          </h2>
          <CalendarHeatmap
            year={now.getUTCFullYear()}
            month={now.getUTCMonth() + 1}
            dailyTotals={stats.allDailyTotals}
            lang={lang}
          />
        </div>

        {(stats.records.bestDay || stats.bestWeekday) && (
          <section className="rounded-2xl border border-black/5 bg-brand-surface p-4">
            <h2 className="mb-3 text-sm font-semibold text-brand-navy">
              {t(lang, "records")}
            </h2>
            <div className="flex flex-col gap-2.5 text-sm">
              {stats.records.bestDay && (
                <div className="flex items-center justify-between">
                  <span className="text-brand-muted">{t(lang, "bestDayRow")}</span>
                  <span className="font-serif text-xl leading-5 font-normal text-brand-navy">
                    {formatBaht(stats.records.bestDay.totalBaht)}
                    <span className="ml-2 font-sans text-xs font-medium text-brand-muted">
                      {formatDate(stats.records.bestDay.date, locale)}
                    </span>
                  </span>
                </div>
              )}
              {stats.records.bestMonth && (
                <div className="flex items-center justify-between">
                  <span className="text-brand-muted">{t(lang, "bestMonthRow")}</span>
                  <span className="font-serif text-xl leading-5 font-normal text-brand-navy">
                    {formatBaht(stats.records.bestMonth.total)}
                    <span className="ml-2 font-sans text-xs font-medium text-brand-muted">
                      {formatMonth(stats.records.bestMonth.month, locale)}
                    </span>
                  </span>
                </div>
              )}
              {stats.records.biggestSession && (
                <div className="flex items-center justify-between">
                  <span className="text-brand-muted">{t(lang, "biggestSession")}</span>
                  <span className="font-serif text-xl leading-5 font-normal text-brand-navy">
                    {formatBaht(stats.records.biggestSession.totalBaht)}
                    <span className="ml-2 font-sans text-xs font-medium text-brand-muted">
                      {formatDate(stats.records.biggestSession.date, locale)}
                    </span>
                  </span>
                </div>
              )}
              {stats.bestWeekday && (
                <p className="mt-1 rounded-xl bg-brand-purple/8 px-3 py-2 text-xs font-medium text-brand-purple-dark">
                  {t(lang, "bestWeekday", {
                    day: weekdayLabel(stats.bestWeekday.weekday, lang),
                    amt: formatBaht(stats.bestWeekday.avg),
                    pct: `${stats.bestWeekday.pctAboveOverall >= 0 ? "+" : ""}${stats.bestWeekday.pctAboveOverall.toFixed(0)}`,
                  })}
                </p>
              )}
            </div>
          </section>
        )}

        <div>
          <h2 className="mb-2 px-1 text-sm font-semibold text-brand-navy">
            {t(lang, "denominationMix")}
          </h2>
          <DonutChartWrapper data={stats.denominationMix} />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between px-1">
            <h2 className="text-sm font-semibold text-brand-navy">
              {t(lang, "recentSessions")}
            </h2>
            <Link
              href="/sessions"
              prefetch={true}
              className="text-xs font-medium text-brand-purple"
            >
              {t(lang, "viewAll")}
            </Link>
          </div>
          <SessionsTable sessions={[...recentSessions].reverse()} lang={lang} />
        </div>
      </main>
      <BottomTabBar />
    </div>
    </I18nProvider>
  );
}
