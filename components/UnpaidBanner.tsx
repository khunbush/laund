import { formatBaht } from "@/lib/denominations";

export function UnpaidBanner({
  unpaidTotal,
  unpaidCount,
}: {
  unpaidTotal: number;
  unpaidCount: number;
}) {
  if (unpaidCount === 0) {
    return (
      <div className="rounded-2xl bg-brand-green/10 px-4 py-3 text-sm font-semibold text-brand-green-dark">
        ✓ All paid up
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
          not yet paid to you
        </p>
      </div>
      <span className="rounded-full bg-brand-purple/15 px-3 py-1 text-xs font-bold text-brand-purple-dark">
        {unpaidCount} session{unpaidCount === 1 ? "" : "s"}
      </span>
    </div>
  );
}
