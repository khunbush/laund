import { formatBaht } from "@/lib/denominations";

export function RunningTotalHero({
  label,
  dateLabel,
  total,
}: {
  label: string;
  dateLabel: string;
  total: number;
}) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-brand-navy p-6 text-white shadow-xl shadow-black/20">
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-brand-purple/30 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-16 -left-10 h-40 w-40 rounded-full bg-brand-orange/20 blur-2xl" />
      <div className="relative flex items-center justify-between">
        <p className="text-sm font-medium text-white/60">{label}</p>
        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/80">
          {dateLabel}
        </span>
      </div>
      <p className="relative mt-3 text-4xl font-extrabold tracking-tight">
        {formatBaht(total)}
      </p>
    </div>
  );
}
