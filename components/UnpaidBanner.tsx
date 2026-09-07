"use client";

import { formatBaht } from "@/lib/denominations";
import { useT } from "@/components/I18nProvider";

export function UnpaidBanner({
  unpaidTotal,
  unpaidCount,
  unpaidExclCoins,
  unpaidSmallCoins,
}: {
  unpaidTotal: number;
  unpaidCount: number;
  /** When provided, a small "(… excluding small coins)" line renders under
   * the total. ฿10 coins are included in the figure; only ฿5/฿2/฿1 are not. */
  unpaidExclCoins?: number;
  /** When provided, a "(… in small coins)" line renders under that — the
   * ฿5/฿2/฿1 half of the same total. */
  unpaidSmallCoins?: number;
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
        {unpaidExclCoins !== undefined && (
          <p className="text-xs font-medium text-brand-purple-dark/60">
            ({formatBaht(unpaidExclCoins)} {t("exclCoins")})
          </p>
        )}
        {unpaidSmallCoins !== undefined && (
          <p className="text-xs font-medium text-brand-purple-dark/60">
            ({formatBaht(unpaidSmallCoins)} {t("inSmallCoins")})
          </p>
        )}
      </div>
      <span className="rounded-full bg-brand-purple/15 px-3 py-1 text-xs font-bold text-brand-purple-dark">
        {tn("sessions", unpaidCount)}
      </span>
    </div>
  );
}
