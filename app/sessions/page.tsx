import Link from "next/link";
import { listSessions } from "@/lib/data/sessions";
import { getUnpaidSummary } from "@/lib/data/dashboard";
import { HistoryView } from "@/components/HistoryView";
import type { PaidFilter } from "@/components/PaidFilterBar";
import { I18nProvider } from "@/components/I18nProvider";
import { t } from "@/lib/i18n";
import { getLang } from "@/lib/i18n-server";

export default async function SessionsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; filter?: string }>;
}) {
  const lang = await getLang();
  const { page: pageParam, filter: filterParam } = await searchParams;
  const filter: PaidFilter =
    filterParam === "paid" || filterParam === "unpaid" ? filterParam : "all";
  const page = Math.max(1, Number.parseInt(pageParam ?? "1", 10) || 1);
  const pageSize = 20;
  const [{ sessions, total }, unpaid] = await Promise.all([
    listSessions({
      page,
      pageSize,
      paid: filter === "all" ? undefined : filter === "paid",
    }),
    getUnpaidSummary(),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const filterQuery = filter === "all" ? "" : `&filter=${filter}`;

  return (
    <I18nProvider lang={lang}>
    <div className="flex flex-1 flex-col bg-background">
      <main className="safe-top mx-auto flex w-full max-w-md flex-1 flex-col px-4 pt-6">
        <div className="mb-4 flex items-center justify-between px-1">
          <h1 className="text-xl font-bold text-brand-navy">{t(lang, "history")}</h1>
          <a
            href="/api/export"
            className="rounded-full bg-black/5 px-3.5 py-1.5 text-xs font-semibold text-brand-navy/70 transition active:scale-95"
          >
            {t(lang, "exportCsv")}
          </a>
        </div>
        <HistoryView
          sessions={sessions}
          unpaidTotal={unpaid.unpaidTotal}
          unpaidCount={unpaid.unpaidCount}
          unpaidExclCoins={unpaid.unpaidExclCoins}
          unpaidSmallCoins={unpaid.unpaidSmallCoins}
          lang={lang}
          filter={filter}
          emptyMessage={
            filter === "all" ? undefined : t(lang, "noSessionsFiltered")
          }
        />
        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between px-1 text-sm text-brand-muted">
            <Link
              href={`/sessions?page=${Math.max(1, page - 1)}${filterQuery}`}
              aria-disabled={page <= 1}
              className={`rounded-full px-3 py-1.5 transition active:scale-95 ${
                page <= 1
                  ? "pointer-events-none opacity-30"
                  : "font-medium text-brand-purple"
              }`}
            >
              {t(lang, "newer")}
            </Link>
            <span>{t(lang, "pageOf", { p: page, n: totalPages })}</span>
            <Link
              href={`/sessions?page=${Math.min(totalPages, page + 1)}${filterQuery}`}
              aria-disabled={page >= totalPages}
              className={`rounded-full px-3 py-1.5 transition active:scale-95 ${
                page >= totalPages
                  ? "pointer-events-none opacity-30"
                  : "font-medium text-brand-purple"
              }`}
            >
              {t(lang, "older")}
            </Link>
          </div>
        )}
      </main>
    </div>
    </I18nProvider>
  );
}
