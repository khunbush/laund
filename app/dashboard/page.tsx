import { getDashboardStats, getProjections } from "@/lib/data/dashboard";
import { getRecentSessions } from "@/lib/data/sessions";
import { StatCard } from "@/components/StatCard";
import { BarChartWrapper } from "@/components/BarChartWrapper";
import { DonutChartWrapper } from "@/components/DonutChartWrapper";
import { SessionsTable } from "@/components/SessionsTable";
import { BottomTabBar } from "@/components/BottomTabBar";
import { formatBaht } from "@/lib/denominations";
import Link from "next/link";

// Always fetch fresh data — this is financial data that can also change
// outside the app (e.g. a manual correction in the Neon console), so a
// statically cached snapshot would be unsafe here.
export const dynamic = "force-dynamic";

const CONFIDENCE_LABEL: Record<string, string> = {
  none: "Not enough data yet",
  low: "Low confidence",
  ok: "Good confidence",
};

function formatDate(date: Date | null) {
  if (!date) return "—";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default async function DashboardPage() {
  const [stats, projections, recentSessions] = await Promise.all([
    getDashboardStats(),
    getProjections(),
    getRecentSessions(8),
  ]);

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-background">
      <main className="safe-top mx-auto flex w-full max-w-md flex-1 flex-col gap-5 px-4 pt-6 pb-6">
        <h1 className="px-1 text-xl font-bold text-brand-navy">Dashboard</h1>

        <div className="grid grid-cols-2 gap-3">
          <StatCard
            variant="navy"
            label="Total Collected"
            value={formatBaht(stats.totalCollected)}
            caption={`${stats.sessionCount} sessions`}
          />
          <StatCard
            variant="purple"
            label="Avg / Collection Day"
            value={stats.averagePerDay ? formatBaht(stats.averagePerDay) : "—"}
            caption={`${stats.dayCount} days`}
          />
          <StatCard
            variant={
              stats.daysSinceLastCollection !== null && stats.daysSinceLastCollection >= 3
                ? "orange"
                : "white"
            }
            label="Days Since Last"
            value={
              stats.daysSinceLastCollection !== null
                ? `${stats.daysSinceLastCollection}d`
                : "—"
            }
            caption={formatDate(stats.lastCollectionDate)}
          />
          <StatCard
            variant="white"
            label="Avg Interval"
            value={
              stats.averageDaysBetweenCollections
                ? `${stats.averageDaysBetweenCollections.toFixed(1)}d`
                : "—"
            }
          />
        </div>

        <section className="rounded-2xl border border-black/5 bg-brand-surface p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-brand-navy">Projections</h2>
            <span className="rounded-full bg-black/5 px-2.5 py-1 text-[11px] font-medium text-brand-muted">
              {CONFIDENCE_LABEL[projections.confidence]}
            </span>
          </div>
          {projections.confidence === "none" ? (
            <p className="text-sm text-brand-muted">
              Log a few more sessions to unlock projections.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-brand-muted">Projected next collection</p>
                <p className="text-lg font-bold text-brand-purple-dark">
                  {formatBaht(projections.projectedNextSessionAmount ?? 0)}
                </p>
                <p className="text-xs text-brand-muted">
                  ~{formatDate(projections.projectedNextSessionDate)}
                </p>
              </div>
              <div>
                <p className="text-xs text-brand-muted">Projected month-end</p>
                <p className="text-lg font-bold text-brand-orange-dark">
                  {formatBaht(projections.projectedMonthEndTotal)}
                </p>
                <p className="text-xs text-brand-muted">
                  {formatBaht(projections.actualCollectedThisMonth)} so far
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
            Denomination Mix
          </h2>
          <DonutChartWrapper data={stats.denominationMix} />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between px-1">
            <h2 className="text-sm font-semibold text-brand-navy">
              Recent Sessions
            </h2>
            <Link
              href="/sessions"
              prefetch={true}
              className="text-xs font-medium text-brand-purple"
            >
              View all →
            </Link>
          </div>
          <SessionsTable sessions={[...recentSessions].reverse()} />
        </div>
      </main>
      <BottomTabBar />
    </div>
  );
}
