"use client";

import { formatBaht } from "@/lib/denominations";
import { useT } from "@/components/I18nProvider";

export function UnpaidBanner({
  unpaidTotal,
  unpaidCount,
}: {
  unpaidTotal: number;
  unpaidCount: number;
}) {
  const { t, tn } = useT();
  if (unpaidCount === 0) {
    return (
      <div className="rounded-2xl bg-brand-green/10 px-4 py-3 text-sm font-semibold text-brand-green-dark">
        {t("allPaidUp")}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between rounded-2xl bg-brand-purple/10 px-4 py-3">
      <div>
        <p className="font-serif text-2xl leading-7 font-normal text-brand-purple-dark">
          {formatBaht(unpaidTotal)}
        </p>
        <p className="text-xs font-medium text-brand-purple-dark/80">
          {t("notYetPaid")}
        </p>
      </div>
      <span className="rounded-full bg-brand-purple/15 px-3 py-1 text-xs font-bold text-brand-purple-dark">
        {tn("sessions", unpaidCount)}
      </span>
    </div>
  );
}
