import Link from "next/link";
import { getMonthlyReport } from "@/lib/data/reports";
import { CalendarHeatmap } from "@/components/CalendarHeatmap";
import { StatCard } from "@/components/StatCard";
import { BottomTabBar } from "@/components/BottomTabBar";
import { formatBaht } from "@/lib/denominations";
import { KIND_EMOJI, KIND_LABELS, type SessionKindValue } from "@/lib/kinds";

export const dynamic = "force-dynamic";

const KIND_ORDER: SessionKindValue[] = ["LAUNDRY", "SNOOKER", "LUMP_SUM"];

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

export default async function ReportPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month: monthParam } = await searchParams;
  const month = /^\d{4}-\d{2}$/.test(monthParam ?? "")
    ? monthParam!
    : currentMonth();

  const report = await getMonthlyReport(month);
  const [year, monthNum] = month.split("-").map(Number);
  const paidPct =
    report.total > 0 ? (report.paidTotal / report.total) * 100 : 0;

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-background">
      <main className="safe-top mx-auto flex w-full max-w-md flex-1 flex-col gap-5 px-4 pt-6 pb-6">
        <div className="flex items-center justify-between px-1">
          <Link
            href={`/report?month=${report.prevMonth}`}
            className="rounded-full bg-black/5 px-3.5 py-1.5 text-sm font-bold text-brand-navy transition active:scale-95"
            aria-label="Previous month"
          >
            ‹
          </Link>
          <h1 className="text-lg font-bold text-brand-navy">
            {monthTitle(month)}
          </h1>
          <Link
            href={`/report?month=${report.nextMonth}`}
            className="rounded-full bg-black/5 px-3.5 py-1.5 text-sm font-bold text-brand-navy transition active:scale-95"
            aria-label="Next month"
          >
            ›
          </Link>
        </div>

        {report.sessionCount === 0 ? (
          <p className="rounded-2xl bg-brand-surface p-6 text-center text-sm text-brand-muted">
            No sessions recorded in {monthTitle(month)}.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                variant="navy"
                label="Month Total"
                value={formatBaht(report.total)}
                caption={`${report.sessionCount} sessions · ${report.dayCount} days`}
              />
              <StatCard
                variant={
                  report.pctChange === null
                    ? "white"
                    : report.pctChange >= 0
                      ? "purple"
                      : "orange"
                }
                label="vs Last Month"
                value={
                  report.pctChange === null
                    ? "—"
                    : `${report.pctChange >= 0 ? "+" : ""}${report.pctChange.toFixed(0)}%`
                }
                caption={
                  report.prevTotal > 0
                    ? `${formatBaht(report.prevTotal)} last month`
                    : "no data last month"
                }
              />
              <StatCard
                variant="white"
                label="Avg / Day"
                value={
                  report.averagePerDay ? formatBaht(report.averagePerDay) : "—"
                }
              />
              <StatCard
                variant="white"
                label="Best Day"
                value={report.bestDay ? formatBaht(report.bestDay.totalBaht) : "—"}
                caption={report.bestDay ? formatDay(report.bestDay.date) : undefined}
              />
            </div>

            <section className="rounded-2xl border border-black/5 bg-brand-surface p-4">
              <h2 className="mb-3 text-sm font-semibold text-brand-navy">
                By Type
              </h2>
              <div className="flex flex-col gap-2.5">
                {KIND_ORDER.filter((k) => report.byKind[k] > 0).map((k) => (
                  <div key={k} className="flex items-center justify-between text-sm">
                    <span className="text-brand-muted">
                      {KIND_EMOJI[k]} {KIND_LABELS[k]}
                    </span>
                    <span className="font-semibold text-brand-navy">
                      {formatBaht(report.byKind[k])}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-black/5 bg-brand-surface p-4">
              <h2 className="mb-3 text-sm font-semibold text-brand-navy">
                Paid vs Unpaid
              </h2>
              <div className="mb-2 flex h-3 overflow-hidden rounded-full bg-black/5">
                {report.paidTotal > 0 && (
                  <div
                    className="bg-[#0ca30c]"
                    style={{ width: `${paidPct}%` }}
                  />
                )}
                {report.unpaidTotal > 0 && (
                  <div
                    className="bg-[#d03b3b]"
                    style={{ width: `${100 - paidPct}%` }}
                  />
                )}
              </div>
              <div className="flex justify-between text-xs font-medium">
                <span className="text-[#0a7d0a]">
                  Paid {formatBaht(report.paidTotal)}
                </span>
                <span className="text-[#c02f2f]">
                  Unpaid {formatBaht(report.unpaidTotal)}
                </span>
              </div>
            </section>

            <div>
              <h2 className="mb-2 px-1 text-sm font-semibold text-brand-navy">
                Collection Days
              </h2>
              <CalendarHeatmap
                year={year}
                month={monthNum}
                dailyTotals={report.dailyTotals}
              />
            </div>
          </>
        )}
      </main>
      <BottomTabBar />
    </div>
  );
}
