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
      <div className="rounded-2xl bg-[#0ca30c]/10 px-4 py-3 text-sm font-semibold text-[#0a7d0a]">
        ✓ All paid up
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between rounded-2xl bg-[#d03b3b]/10 px-4 py-3">
      <div>
        <p className="text-lg font-bold text-[#c02f2f]">
          {formatBaht(unpaidTotal)}
        </p>
        <p className="text-xs font-medium text-[#c02f2f]/80">
          not yet paid to you
        </p>
      </div>
      <span className="rounded-full bg-[#d03b3b]/15 px-3 py-1 text-xs font-bold text-[#c02f2f]">
        {unpaidCount} session{unpaidCount === 1 ? "" : "s"}
      </span>
    </div>
  );
}
