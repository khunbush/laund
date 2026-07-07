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

function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export async function getMonthlyReport(month: string) {
  const { start, end } = monthRange(month);
  const prevMonth = shiftMonth(month, -1);
  const prev = monthRange(prevMonth);

  const [sessions, prevAgg] = await Promise.all([
    prisma.collectionSession.findMany({
      where: { date: { gte: start, lt: end } },
      orderBy: [{ date: "asc" }, { createdAt: "asc" }],
      select: { date: true, totalBaht: true, kind: true, paid: true },
    }),
    prisma.collectionSession.aggregate({
      where: { date: { gte: prev.start, lt: prev.end } },
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
    pctChange,
    dailyTotals,
  };
}
