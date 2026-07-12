import Link from "next/link";
import { getBranchPerformance } from "@/lib/data/branches";
import {
  BranchHourlyChart,
  BranchTrendChart,
  BranchWeekdayChart,
} from "@/components/BranchChart";
import { StatCard } from "@/components/StatCard";
import { BottomTabBar } from "@/components/BottomTabBar";
import { formatBaht } from "@/lib/denominations";
import { BRANCH_COLORS } from "@/lib/chartColors";
import { currentMonthIct } from "@/lib/ict";
import { I18nProvider } from "@/components/I18nProvider";
import { dateLocale, DOW_KEYS, t, type Lang } from "@/lib/i18n";
import { getLang } from "@/lib/i18n-server";

// Always live: this page reads the machine data that the Match tab's uploads
// maintain, so it must reflect the exact current state, never a cached
// snapshot.
export const dynamic = "force-dynamic";

const BRANCH_NAMES: Record<1 | 2, string> = {
  1: "Marina",
  2: "LeBush",
};

type View = "all" | "1" | "2";

function monthTitle(month: string, locale: string) {
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString(locale, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function monthDayLabel(month: string, day: number, locale: string) {
  const [y, m] = month.split("-").map(Number);
  // Clamp: the cutoff day comes from the selected month and may not exist in
  // the previous month (e.g. day 31 vs a 30-day month).
  const clamped = Math.min(day, new Date(Date.UTC(y, m, 0)).getUTCDate());
  return new Date(Date.UTC(y, m - 1, clamped)).toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
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

export default async function BranchesPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; view?: string }>;
}) {
  const lang = await getLang();
  const locale = dateLocale(lang);
  const { month: monthParam, view: viewParam } = await searchParams;
  const month = /^\d{4}-\d{2}$/.test(monthParam ?? "")
    ? monthParam!
    : currentMonthIct();
  const view: View =
    viewParam === "1" || viewParam === "2" ? viewParam : "all";

  const perf = await getBranchPerformance(month);

  const shownBranches: (1 | 2)[] =
    view === "all" ? [1, 2] : [Number(view) as 1 | 2];
  const series = shownBranches.map((b) => ({
    key: b === 1 ? ("b1" as const) : ("b2" as const),
    name: BRANCH_NAMES[b],
    color: BRANCH_COLORS[b],
  }));
  const monthHasData = shownBranches.some(
    (b) => perf.branches[b].activeDays > 0,
  );
  const weekday = perf.weekday.map((w, i) => ({
    ...w,
    dow: t(lang, DOW_KEYS[i]),
  }));

  return (
    <I18nProvider lang={lang}>
    <div className="flex min-h-screen flex-1 flex-col bg-background">
      <main className="safe-top mx-auto flex w-full max-w-md flex-1 flex-col gap-5 px-4 pt-6 pb-6">
        <div className="flex items-center justify-between px-1">
          <Link
            href={`/branches?month=${perf.prevMonth}&view=${view}`}
            className="rounded-full bg-black/5 px-3.5 py-1.5 text-sm font-bold text-brand-navy transition active:scale-95"
            aria-label={t(lang, "prevMonth")}
          >
            ‹
          </Link>
          <h1 className="text-lg font-bold text-brand-navy">
            {monthTitle(month, locale)}
          </h1>
          <Link
            href={`/branches?month=${perf.nextMonth}&view=${view}`}
            className="rounded-full bg-black/5 px-3.5 py-1.5 text-sm font-bold text-brand-navy transition active:scale-95"
            aria-label={t(lang, "nextMonth")}
          >
            ›
          </Link>
        </div>

        <div className="flex gap-1 rounded-full bg-black/5 p-1 text-xs font-semibold">
          {(
            [
              ["all", t(lang, "bothBranches")],
              ["1", BRANCH_NAMES[1]],
              ["2", BRANCH_NAMES[2]],
            ] as const
          ).map(([v, label]) => (
            <Link
              key={v}
              href={`/branches?month=${month}&view=${v}`}
              className={`flex-1 rounded-full px-3 py-1.5 text-center transition ${
                view === v
                  ? "bg-white text-brand-navy shadow-sm"
                  : "text-brand-muted"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>

        {!monthHasData ? (
          <p className="rounded-2xl bg-brand-surface p-6 text-center text-sm text-brand-muted">
            {t(lang, "noMachineDataMonth", {
              month: monthTitle(month, locale),
            })}
          </p>
        ) : (
          (() => {
            const s =
              view === "all"
                ? perf.combined
                : perf.branches[shownBranches[0]];
            return (
              <div className="grid grid-cols-2 gap-3">
                <StatCard
                  variant="navy"
                  label={
                    view === "all"
                      ? t(lang, "totalRevenue")
                      : t(lang, "monthRevenue")
                  }
                  value={formatBaht(s.revenue)}
                  caption={
                    view === "all"
                      ? `${BRANCH_NAMES[1]} ${formatBaht(perf.branches[1].revenue)} · ${BRANCH_NAMES[2]} ${formatBaht(perf.branches[2].revenue)}`
                      : t(lang, "daysWithData", { n: s.activeDays })
                  }
                />
                <StatCard
                  variant={
                    s.pctChangeSameDay === null
                      ? "white"
                      : s.pctChangeSameDay >= 0
                        ? "purple"
                        : "orange"
                  }
                  label={t(lang, "vsLastMonthToday")}
                  value={
                    s.pctChangeSameDay === null
                      ? "—"
                      : `${s.pctChangeSameDay >= 0 ? "+" : ""}${s.pctChangeSameDay.toFixed(0)}%`
                  }
                  caption={
                    s.prevRevenueSameDay > 0 && s.sameDayCutoff !== null
                      ? t(lang, "byDate", {
                          amt: formatBaht(s.prevRevenueSameDay),
                          date: monthDayLabel(
                            perf.prevMonth,
                            s.sameDayCutoff,
                            locale,
                          ),
                        })
                      : t(lang, "noDataLastMonth")
                  }
                />
                <StatCard
                  variant="white"
                  label={t(lang, "avgPerDay")}
                  value={
                    s.avgPerDay !== null
                      ? formatBaht(Math.round(s.avgPerDay))
                      : "—"
                  }
                />
                <StatCard
                  variant={
                    s.pctChange === null
                      ? "white"
                      : s.pctChange >= 0
                        ? "purple"
                        : "orange"
                  }
                  label={t(lang, "vsLastMonth")}
                  value={
                    s.pctChange === null
                      ? "—"
                      : `${s.pctChange >= 0 ? "+" : ""}${s.pctChange.toFixed(0)}%`
                  }
                  caption={
                    s.prevRevenue > 0
                      ? t(lang, "lastMonthAmt", {
                          amt: formatBaht(s.prevRevenue),
                        })
                      : t(lang, "noDataLastMonth")
                  }
                />
                <StatCard
                  variant="white"
                  label={t(lang, "bestDayCard")}
                  value={s.bestDay ? formatBaht(s.bestDay.revenue) : "—"}
                  caption={
                    s.bestDay ? formatDay(s.bestDay.date, locale) : undefined
                  }
                />
                <StatCard
                  variant="white"
                  label={t(lang, "orders")}
                  value={String(s.orders)}
                  caption={
                    s.orders > 0 && s.revenue > 0
                      ? t(lang, "perOrder", {
                          amt: formatBaht(Math.round(s.revenue / s.orders)),
                        })
                      : undefined
                  }
                />
              </div>
            );
          })()
        )}

        <BranchTrendChart
          series={series}
          daily={perf.daily}
          monthly={perf.monthly}
          stacked={view === "all"}
        />
        <BranchWeekdayChart
          series={series}
          weekday={weekday}
          stacked={view === "all"}
        />
        <BranchHourlyChart
          series={series}
          hourly={perf.hourly}
          since={perf.txnSince}
          stacked={view === "all"}
        />
      </main>
      <BottomTabBar />
    </div>
    </I18nProvider>
  );
}
