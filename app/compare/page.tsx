import { getComparison, type CompareRow } from "@/lib/data/compare";
import { getMachineStatus } from "@/lib/data/machine";
import { BottomTabBar } from "@/components/BottomTabBar";
import { MachineUpload } from "@/components/MachineUpload";
import { ClearMachineButton } from "@/components/ClearMachineButton";
import { StatCard } from "@/components/StatCard";
import { formatBaht } from "@/lib/denominations";
import { RefreshButton } from "@/components/RefreshButton";
import { I18nProvider } from "@/components/I18nProvider";
import { dateLocale, t, tn, type Lang } from "@/lib/i18n";
import { getLang } from "@/lib/i18n-server";

// Always live: this page reconciles counted cash against machine data, so it
// must reflect the exact current state (including data changed via the import
// API or an external edit), never a cached snapshot. Transient render failures
// are caught by app/error.tsx and the service worker's navigation fallback.
export const dynamic = "force-dynamic";

function fmtDate(iso: string, locale: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

function DiffBadge({ diff, lang }: { diff: number; lang: Lang }) {
  if (diff === 0) {
    return (
      <span className="rounded-full bg-brand-green/15 px-2.5 py-1 text-xs font-bold text-brand-green-dark">
        {t(lang, "exactMatch")}
      </span>
    );
  }
  if (diff > 0) {
    return (
      <span className="rounded-full bg-brand-green/15 px-2.5 py-1 text-xs font-bold text-brand-green-dark">
        {t(lang, "overBy", { amt: formatBaht(diff) })}
      </span>
    );
  }
  return (
    <span className="rounded-full bg-brand-purple/15 px-2.5 py-1 text-xs font-bold text-brand-purple-dark">
      {t(lang, "shortBy", { amt: formatBaht(Math.abs(diff)) })}
    </span>
  );
}

function CompareCard({ row, lang }: { row: CompareRow; lang: Lang }) {
  const missing1 = row.branch1DaysCovered < row.windowDays;
  const missing2 = row.branch2DaysCovered < row.windowDays;
  const noData = row.machineTotal === 0;
  const locale = dateLocale(lang);

  return (
    <div className="rounded-2xl border border-black/5 bg-brand-surface p-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-brand-navy">
            {t(lang, "collectedOn", {
              date: fmtDate(row.collectedDate, locale),
            })}
          </p>
          <p className="text-xs text-brand-muted">
            {row.isFirst ? t(lang, "firstCollection") : ""}
            {fmtDate(row.windowStart, locale)} →{" "}
            {fmtDate(row.windowEnd, locale)} ·{" "}
            {tn(lang, "days", row.windowDays)}
          </p>
        </div>
        {!noData && <DiffBadge diff={row.diff} lang={lang} />}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs text-brand-muted">{t(lang, "youCounted")}</p>
          <p className="font-serif text-xl leading-6 font-normal text-brand-navy">
            {formatBaht(row.counted)}
          </p>
        </div>
        <div>
          <p className="text-xs text-brand-muted">{t(lang, "machinesSay")}</p>
          <p className="font-serif text-xl leading-6 font-normal text-brand-purple-dark">
            {noData ? "—" : formatBaht(row.machineTotal)}
          </p>
        </div>
      </div>

      {!noData && (
        <p className="mt-2 text-xs text-brand-muted">
          Marina {formatBaht(row.machineBranch1)} · LeBush{" "}
          {formatBaht(row.machineBranch2)}
        </p>
      )}

      {noData ? (
        <p className="mt-2 rounded-lg bg-black/[0.03] px-2.5 py-1.5 text-xs text-brand-muted">
          {t(lang, "noWindowData")}
        </p>
      ) : (
        (missing1 || missing2) && (
          <p className="mt-2 rounded-lg bg-brand-orange/8 px-2.5 py-1.5 text-xs text-brand-orange-dark">
            {t(lang, "partialData")}
            {missing1
              ? t(lang, "partialBranch", {
                  name: "Marina",
                  a: row.branch1DaysCovered,
                  b: row.windowDays,
                })
              : ""}
            {missing1 && missing2 ? ", " : ""}
            {missing2
              ? t(lang, "partialBranch", {
                  name: "LeBush",
                  a: row.branch2DaysCovered,
                  b: row.windowDays,
                })
              : ""}
            {t(lang, "partialSuffix")}
          </p>
        )
      )}
    </div>
  );
}

export default async function ComparePage() {
  const lang = await getLang();
  const locale = dateLocale(lang);
  const [comparison, status] = await Promise.all([
    getComparison(),
    getMachineStatus(),
  ]);

  return (
    <I18nProvider lang={lang}>
    <div className="flex min-h-screen flex-1 flex-col bg-background">
      <main className="safe-top mx-auto flex w-full max-w-md flex-1 flex-col gap-5 px-4 pt-6 pb-6">
        <div className="flex items-center justify-between px-1">
          <h1 className="text-xl font-bold text-brand-navy">
            {t(lang, "machineMatch")}
          </h1>
          <RefreshButton />
        </div>

        {!comparison.hasMachineData ? (
          <p className="rounded-2xl bg-brand-surface p-6 text-center text-sm text-brand-muted">
            {t(lang, "noMachineData")}
          </p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                variant="navy"
                label={t(lang, "countedMatched")}
                value={formatBaht(comparison.totalCounted)}
              />
              <StatCard
                variant={comparison.totalDiff < 0 ? "orange" : "purple"}
                label={t(lang, "vsMachines")}
                value={`${comparison.totalDiff >= 0 ? "+" : ""}${formatBaht(comparison.totalDiff)}`}
                caption={t(lang, "machinesCaption", {
                  amt: formatBaht(comparison.totalMachine),
                })}
              />
            </div>

            {comparison.pending && comparison.pending.machineTotal > 0 && (
              <div className="rounded-2xl bg-brand-purple/8 px-4 py-3">
                <p className="text-sm font-bold text-brand-purple-dark">
                  {t(lang, "earnedSinceLast", {
                    amt: formatBaht(comparison.pending.machineTotal),
                  })}
                </p>
                <p className="text-xs text-brand-muted">
                  {t(lang, "pendingDetail", {
                    from: fmtDate(comparison.pending.since!, locale),
                    to: fmtDate(comparison.pending.until, locale),
                    b1: formatBaht(comparison.pending.branch1),
                    b2: formatBaht(comparison.pending.branch2),
                  })}
                </p>
              </div>
            )}

            <div className="flex flex-col gap-2">
              {comparison.rows
                .filter((row) => row.machineTotal > 0)
                .map((row) => (
                  <CompareCard key={row.dateKey} row={row} lang={lang} />
                ))}
            </div>

            {comparison.rows.some((row) => row.machineTotal === 0) && (
              <details className="rounded-2xl border border-black/5 bg-brand-surface">
                <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-brand-muted">
                  {tn(
                    lang,
                    "earlierCollections",
                    comparison.rows.filter((r) => r.machineTotal === 0).length,
                  )}
                </summary>
                <div className="flex flex-col gap-2 px-3 pb-3">
                  {comparison.rows
                    .filter((row) => row.machineTotal === 0)
                    .map((row) => (
                      <CompareCard key={row.dateKey} row={row} lang={lang} />
                    ))}
                </div>
              </details>
            )}
          </>
        )}

        <MachineUpload />

        <div className="rounded-2xl border border-black/5 bg-brand-surface p-4">
          <h2 className="mb-2 text-sm font-semibold text-brand-navy">
            {t(lang, "importedSoFar")}
          </h2>
          <div className="flex flex-col gap-2.5 text-sm">
            {status.map((b) => (
              <div key={b.branch} className="flex items-center justify-between gap-2">
                <span className="min-w-0 flex-1 text-brand-muted">
                  {b.branch === 1 ? "Marina" : "LeBush"}
                </span>
                <span className="text-right font-semibold text-brand-navy">
                  {b.dayCount > 0 ? (
                    <>
                      {tn(lang, "days", b.dayCount)} ·{" "}
                      {formatBaht(b.totalRevenue)}
                      {b.lastDate && (
                        <span className="block text-[11px] font-medium text-brand-muted">
                          {t(lang, "through", {
                            date: fmtDate(b.lastDate, locale),
                          })}
                        </span>
                      )}
                    </>
                  ) : (
                    t(lang, "noneYet")
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
    </I18nProvider>
  );
}
