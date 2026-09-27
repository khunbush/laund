import "server-only";
import { prisma } from "@/lib/db";
import type { SessionKindValue } from "@/lib/kinds";

function monthRange(month: string): { start: Date; end: Date } {
  const [y, m] = month.split("-").map(Number);
  return {
    start: new Date(Date.UTC(y, m - 1, 1)),
    end: new Date(Date.UTC(y, m, 1)), // exclusive
  };
}

export function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

/**
 * @param sameDayCutoff For the month in progress, the day-of-month to compare
 *   through: last month is then summed only up to that day, so "vs last month"
 *   compares equal slices instead of a partial month against a full one
 *   (which reads as a big drop every early month). Omit for past months.
 */
export async function getMonthlyReport(month: string, sameDayCutoff?: number) {
  const { start, end } = monthRange(month);
  const prevMonth = shiftMonth(month, -1);
  const prev = monthRange(prevMonth);
  // Clamp: the cutoff comes from this month and may not exist last month
  // (e.g. the 31st vs a 30-day month).
  const [py, pm] = prevMonth.split("-").map(Number);
  const prevCutoff =
    sameDayCutoff === undefined
      ? null
      : Math.min(sameDayCutoff, new Date(Date.UTC(py, pm, 0)).getUTCDate());
  const prevEnd =
    prevCutoff === null ? prev.end : new Date(Date.UTC(py, pm - 1, prevCutoff + 1));

  const [sessions, prevAgg] = await Promise.all([
    prisma.collectionSession.findMany({
      where: { date: { gte: start, lt: end } },
      orderBy: [{ date: "asc" }, { createdAt: "asc" }],
      select: { date: true, totalBaht: true, kind: true, paid: true },
    }),
    prisma.collectionSession.aggregate({
      where: { date: { gte: prev.start, lt: prevEnd } },
      _sum: { totalBaht: true },
    }),
  ]);

  const total = sessions.reduce((sum, s) => sum + s.totalBaht, 0);
  const sessionCount = sessions.length;

  const byKind: Record<SessionKindValue, number> = {
    LAUNDRY: 0,
    SNOOKER: 0,
    LUMP_SUM: 0,
  };
  let paidTotal = 0;
  let unpaidTotal = 0;
  const byDay = new Map<string, number>();

  for (const s of sessions) {
    byKind[s.kind] += s.totalBaht;
    if (s.paid) paidTotal += s.totalBaht;
    else unpaidTotal += s.totalBaht;
    const key = s.date.toISOString().slice(0, 10);
    byDay.set(key, (byDay.get(key) ?? 0) + s.totalBaht);
  }

  const dayCount = byDay.size;
  const averagePerDay = dayCount > 0 ? total / dayCount : null;

  let bestDay: { date: string; totalBaht: number } | null = null;
  for (const [date, totalBaht] of byDay) {
    if (bestDay === null || totalBaht > bestDay.totalBaht) {
      bestDay = { date, totalBaht };
    }
  }

  const prevTotal = prevAgg._sum.totalBaht ?? 0;
  const pctChange =
    prevTotal > 0 ? ((total - prevTotal) / prevTotal) * 100 : null;

  const dailyTotals = Array.from(byDay.entries())
    .map(([date, totalBaht]) => ({ date, totalBaht }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    month,
    prevMonth,
    nextMonth: shiftMonth(month, 1),
    total,
    sessionCount,
    dayCount,
    averagePerDay,
    byKind,
    paidTotal,
    unpaidTotal,
    bestDay,
    prevTotal,
    /** Day of last month prevTotal runs through; null = the full month. */
    prevCutoff,
    pctChange,
    dailyTotals,
  };
}
