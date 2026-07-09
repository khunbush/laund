import { getComparison, type CompareRow } from "@/lib/data/compare";
import { getMachineStatus } from "@/lib/data/machine";
import { BottomTabBar } from "@/components/BottomTabBar";
import { MachineUpload } from "@/components/MachineUpload";
import { ClearMachineButton } from "@/components/ClearMachineButton";
import { StatCard } from "@/components/StatCard";
import { formatBaht } from "@/lib/denominations";

// Always live: this page reconciles counted cash against machine data, so it
// must reflect the exact current state (including data changed via the import
// API or an external edit), never a cached snapshot. Transient render failures
// are caught by app/error.tsx and the service worker's navigation fallback.
export const dynamic = "force-dynamic";

function fmtDate(iso: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

function DiffBadge({ diff }: { diff: number }) {
  if (diff === 0) {
    return (
      <span className="rounded-full bg-[#0ca30c]/12 px-2.5 py-1 text-xs font-bold text-[#0a7d0a]">
        Exact match
      </span>
    );
  }
  if (diff > 0) {
    return (
      <span className="rounded-full bg-[#0ca30c]/12 px-2.5 py-1 text-xs font-bold text-[#0a7d0a]">
        +{formatBaht(diff)} over
      </span>
    );
  }
  return (
    <span className="rounded-full bg-[#d03b3b]/12 px-2.5 py-1 text-xs font-bold text-[#c02f2f]">
      Short {formatBaht(Math.abs(diff))}
    </span>
  );
}

function CompareCard({ row }: { row: CompareRow }) {
  const missing1 = row.branch1DaysCovered < row.windowDays;
  const missing2 = row.branch2DaysCovered < row.windowDays;
  const noData = row.machineTotal === 0;

  return (
    <div className="rounded-2xl border border-black/5 bg-brand-surface p-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-brand-navy">
            Collected {fmtDate(row.collectedDate)}
          </p>
          <p className="text-xs text-brand-muted">
            {row.isFirst ? "First collection · " : ""}
            {fmtDate(row.windowStart)} → {fmtDate(row.windowEnd)} ·{" "}
            {row.windowDays} day{row.windowDays === 1 ? "" : "s"}
          </p>
        </div>
        {!noData && <DiffBadge diff={row.diff} />}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs text-brand-muted">You counted</p>
          <p className="font-bold text-brand-navy">{formatBaht(row.counted)}</p>
        </div>
        <div>
          <p className="text-xs text-brand-muted">Machines say</p>
          <p className="font-bold text-brand-purple-dark">
            {noData ? "—" : formatBaht(row.machineTotal)}
          </p>
        </div>
      </div>

      {!noData && (
        <p className="mt-2 text-xs text-brand-muted">
          Branch 1 {formatBaht(row.machineBranch1)} · Branch 2{" "}
          {formatBaht(row.machineBranch2)}
        </p>
      )}

      {noData ? (
        <p className="mt-2 rounded-lg bg-black/[0.03] px-2.5 py-1.5 text-xs text-brand-muted">
          No machine data imported for this window yet.
        </p>
      ) : (
        (missing1 || missing2) && (
          <p className="mt-2 rounded-lg bg-brand-orange/8 px-2.5 py-1.5 text-xs text-brand-orange-dark">
            ⚠ Partial data:{" "}
            {missing1 ? `Branch 1 has ${row.branch1DaysCovered}/${row.windowDays} days` : ""}
            {missing1 && missing2 ? ", " : ""}
            {missing2 ? `Branch 2 has ${row.branch2DaysCovered}/${row.windowDays} days` : ""}
            . The comparison may be understated.
          </p>
        )
      )}
    </div>
  );
}

export default async function ComparePage() {
  const [comparison, status] = await Promise.all([
    getComparison(),
    getMachineStatus(),
  ]);

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-background">
      <main className="safe-top mx-auto flex w-full max-w-md flex-1 flex-col gap-5 px-4 pt-6 pb-6">
        <h1 className="px-1 text-xl font-bold text-brand-navy">Machine Match</h1>

        {!comparison.hasMachineData ? (
          <p className="rounded-2xl bg-brand-surface p-6 text-center text-sm text-brand-muted">
            No machine data yet. Upload a washclub CSV below (or have your agent
            POST it) to start comparing your counted cash against machine
            revenue.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                variant="navy"
                label="Counted (matched)"
                value={formatBaht(comparison.totalCounted)}
              />
              <StatCard
                variant={comparison.totalDiff < 0 ? "orange" : "purple"}
                label="vs Machines"
                value={`${comparison.totalDiff >= 0 ? "+" : ""}${formatBaht(comparison.totalDiff)}`}
                caption={`machines: ${formatBaht(comparison.totalMachine)}`}
              />
            </div>

            {comparison.pending && comparison.pending.machineTotal > 0 && (
              <div className="rounded-2xl bg-brand-purple/8 px-4 py-3">
                <p className="text-sm font-bold text-brand-purple-dark">
                  {formatBaht(comparison.pending.machineTotal)} earned since your
                  last collection
                </p>
                <p className="text-xs text-brand-muted">
                  {fmtDate(comparison.pending.since!)} →{" "}
                  {fmtDate(comparison.pending.until)} · not yet counted (B1{" "}
                  {formatBaht(comparison.pending.branch1)} · B2{" "}
                  {formatBaht(comparison.pending.branch2)})
                </p>
              </div>
            )}

            <div className="flex flex-col gap-2">
              {comparison.rows
                .filter((row) => row.machineTotal > 0)
                .map((row) => (
                  <CompareCard key={row.dateKey} row={row} />
                ))}
            </div>

            {comparison.rows.some((row) => row.machineTotal === 0) && (
              <details className="rounded-2xl border border-black/5 bg-brand-surface">
                <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-brand-muted">
                  {comparison.rows.filter((r) => r.machineTotal === 0).length}{" "}
                  earlier collection
                  {comparison.rows.filter((r) => r.machineTotal === 0).length === 1
                    ? ""
                    : "s"}{" "}
                  without machine data ▾
                </summary>
                <div className="flex flex-col gap-2 px-3 pb-3">
                  {comparison.rows
                    .filter((row) => row.machineTotal === 0)
                    .map((row) => (
                      <CompareCard key={row.dateKey} row={row} />
                    ))}
                </div>
              </details>
            )}
          </>
        )}

        <MachineUpload />

        <div className="rounded-2xl border border-black/5 bg-brand-surface p-4">
          <h2 className="mb-2 text-sm font-semibold text-brand-navy">
            Imported so far
          </h2>
          <div className="flex flex-col gap-2.5 text-sm">
            {status.map((b) => (
              <div key={b.branch} className="flex items-center justify-between gap-2">
                <span className="min-w-0 flex-1 text-brand-muted">
                  Branch {b.branch} — {b.branch === 1 ? "washclub" : "washclub v2"}
                </span>
                <span className="text-right font-semibold text-brand-navy">
                  {b.dayCount > 0 ? (
                    <>
                      {b.dayCount} days · {formatBaht(b.totalRevenue)}
                      {b.lastDate && (
                        <span className="block text-[11px] font-medium text-brand-muted">
                          through {fmtDate(b.lastDate)}
                        </span>
                      )}
                    </>
                  ) : (
                    "none yet"
                  )}
                </span>
                {b.dayCount > 0 && b.firstDate && b.lastDate && (
                  <ClearMachineButton
                    branch={b.branch}
                    firstDate={b.firstDate}
                    lastDate={b.lastDate}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </main>
      <BottomTabBar />
    </div>
  );
}
