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

// Always live: this page reads the machine data that the Match tab's uploads
// maintain, so it must reflect the exact current state, never a cached
// snapshot.
export const dynamic = "force-dynamic";

const BRANCH_NAMES: Record<1 | 2, string> = {
  1: "Branch 1",
  2: "Branch 2",
};

type View = "all" | "1" | "2";

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function monthTitle(month: string) {
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function formatDay(iso: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
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
  const { month: monthParam, view: viewParam } = await searchParams;
  const month = /^\d{4}-\d{2}$/.test(monthParam ?? "")
    ? monthParam!
    : currentMonth();
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

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-background">
      <main className="safe-top mx-auto flex w-full max-w-md flex-1 flex-col gap-5 px-4 pt-6 pb-6">
        <div className="flex items-center justify-between px-1">
          <Link
            href={`/branches?month=${perf.prevMonth}&view=${view}`}
            className="rounded-full bg-black/5 px-3.5 py-1.5 text-sm font-bold text-brand-navy transition active:scale-95"
            aria-label="Previous month"
          >
            ‹
          </Link>
          <h1 className="text-lg font-bold text-brand-navy">
            {monthTitle(month)}
          </h1>
          <Link
            href={`/branches?month=${perf.nextMonth}&view=${view}`}
            className="rounded-full bg-black/5 px-3.5 py-1.5 text-sm font-bold text-brand-navy transition active:scale-95"
            aria-label="Next month"
          >
            ›
          </Link>
        </div>

        <div className="flex gap-1 rounded-full bg-black/5 p-1 text-xs font-semibold">
          {(
            [
              ["all", "Both branches"],
              ["1", "Branch 1"],
              ["2", "Branch 2"],
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
            No machine data in {monthTitle(month)}. Data arrives from the
            Match tab&apos;s CSV uploads.
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
                  label={view === "all" ? "Total Revenue" : "Month Revenue"}
                  value={formatBaht(s.revenue)}
                  caption={
                    view === "all"
                      ? `B1 ${formatBaht(perf.branches[1].revenue)} · B2 ${formatBaht(perf.branches[2].revenue)}`
                      : `${s.activeDays} days with data`
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
                  label="vs Last Month"
                  value={
                    s.pctChange === null
                      ? "—"
                      : `${s.pctChange >= 0 ? "+" : ""}${s.pctChange.toFixed(0)}%`
                  }
                  caption={
                    s.prevRevenue > 0
                      ? `${formatBaht(s.prevRevenue)} last month`
                      : "no data last month"
                  }
                />
                <StatCard
                  variant="white"
                  label="Avg / Day"
                  value={
                    s.avgPerDay !== null
                      ? formatBaht(Math.round(s.avgPerDay))
                      : "—"
                  }
                />
                <StatCard
                  variant="white"
                  label="Orders"
                  value={String(s.orders)}
                  caption={
                    s.orders > 0 && s.revenue > 0
                      ? `≈${formatBaht(Math.round(s.revenue / s.orders))} / order`
                      : undefined
                  }
                />
                <StatCard
                  variant="white"
                  label="Best Day"
                  value={s.bestDay ? formatBaht(s.bestDay.revenue) : "—"}
                  caption={s.bestDay ? formatDay(s.bestDay.date) : undefined}
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
          weekday={perf.weekday}
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
  );
}
