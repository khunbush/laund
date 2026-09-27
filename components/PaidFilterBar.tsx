import Link from "next/link";
import { t, type Lang } from "@/lib/i18n";

export type PaidFilter = "all" | "paid" | "unpaid";

const FILTERS = [
  ["all", "filterAll"],
  ["paid", "filterPaid"],
  ["unpaid", "filterUnpaid"],
] as const;

/** All / Paid / Unpaid segmented control for History. Rendered by HistoryView
 * itself (not passed in as a prebuilt element from the server page, which
 * tripped React's list-key check in dev). */
export function PaidFilterBar({ filter, lang }: { filter: PaidFilter; lang: Lang }) {
  return (
    <div className="mb-3 flex gap-1 rounded-full bg-black/5 p-1 text-xs font-semibold">
      {FILTERS.map(([f, key]) => (
        <Link
          key={f}
          href={f === "all" ? "/sessions" : `/sessions?filter=${f}`}
          className={`flex-1 rounded-full px-3 py-1.5 text-center transition ${
            filter === f
              ? "bg-white text-brand-navy shadow-sm"
              : "text-brand-muted"
          }`}
        >
          {t(lang, key)}
        </Link>
      ))}
    </div>
  );
}
