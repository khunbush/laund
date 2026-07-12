import { formatBaht } from "@/lib/denominations";
import { t, type Lang } from "@/lib/i18n";

// Warm sand->terracotta ramp, light -> dark (sequential scale for magnitude).
const RAMP = ["#e6d3b3", "#d8ad7f", "#c47d43", "#b1471e"];
const EMPTY = "rgba(60,50,35,0.06)";

function rampColor(value: number, max: number): string {
  if (value <= 0 || max <= 0) return EMPTY;
  const step = Math.min(
    RAMP.length - 1,
    Math.floor((value / max) * RAMP.length),
  );
  return RAMP[step];
}

const DAY_HEADERS: Record<Lang, string[]> = {
  en: ["M", "T", "W", "T", "F", "S", "S"],
  th: ["จ", "อ", "พ", "พฤ", "ศ", "ส", "อา"],
};

export function CalendarHeatmap({
  year,
  month, // 1-12
  dailyTotals, // ISO date -> works for any range; only this month's dates are used
  lang,
}: {
  year: number;
  month: number;
  dailyTotals: { date: string; totalBaht: number }[];
  lang: Lang;
}) {
  const prefix = `${year}-${String(month).padStart(2, "0")}-`;
  const totalsByDay = new Map<number, number>();
  for (const d of dailyTotals) {
    if (d.date.startsWith(prefix)) {
      totalsByDay.set(Number(d.date.slice(8, 10)), d.totalBaht);
    }
  }
  const max = Math.max(0, ...totalsByDay.values());

  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  // Monday-start column index of the 1st (0=Mon ... 6=Sun).
  const firstWeekday = (new Date(Date.UTC(year, month - 1, 1)).getUTCDay() + 6) % 7;

  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className="rounded-2xl border border-black/5 bg-brand-surface p-4">
      <div className="grid grid-cols-7 gap-1.5">
        {DAY_HEADERS[lang].map((h, i) => (
          <div
            key={`h${i}`}
            className="text-center text-[10px] font-semibold text-brand-muted"
          >
            {h}
          </div>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <div key={`e${i}`} />;
          const value = totalsByDay.get(day) ?? 0;
          const dark = max > 0 && value / max > 0.5;
          return (
            <div
              key={day}
              title={value > 0 ? `${formatBaht(value)}` : undefined}
              className="flex aspect-square items-center justify-center rounded-lg text-[10px] font-semibold"
              style={{
                backgroundColor: rampColor(value, max),
                color: value > 0 ? (dark ? "#fbf7ee" : "#5c3419") : "#8a7d68",
              }}
            >
              {day}
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex items-center justify-end gap-1.5 text-[10px] text-brand-muted">
        {t(lang, "heatLess")}
        <span className="h-2.5 w-2.5 rounded" style={{ backgroundColor: EMPTY }} />
        {RAMP.map((c) => (
          <span key={c} className="h-2.5 w-2.5 rounded" style={{ backgroundColor: c }} />
        ))}
        {t(lang, "heatMore")}
      </div>
    </div>
  );
}
