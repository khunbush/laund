import "server-only";
import { prisma } from "@/lib/db";
import { shiftMonth } from "@/lib/data/reports";

export interface BranchMonthStats {
  revenue: number;
  orders: number;
  activeDays: number;
  avgPerDay: number | null;
  bestDay: { date: string; revenue: number } | null;
  prevRevenue: number;
  pctChange: number | null;
  hasAnyData: boolean; // whether this branch has rows in any month
}

export interface BranchPerformance {
  month: string;
  prevMonth: string;
  nextMonth: string;
  branches: Record<1 | 2, BranchMonthStats>;
  // One entry per day of the selected month that has data for either branch;
  // null = that branch has no row for the day (distinct from a real ฿0 day).
  daily: { date: string; b1: number | null; b2: number | null }[];
  monthly: { month: string; b1: number | null; b2: number | null }[];
  weekday: { dow: string; b1: number | null; b2: number | null }[];
}

const DOW_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function emptyStats(): BranchMonthStats {
  return {
    revenue: 0,
    orders: 0,
    activeDays: 0,
    avgPerDay: null,
    bestDay: null,
    prevRevenue: 0,
    pctChange: null,
    hasAnyData: false,
  };
}

/**
 * Everything the Branches page needs, computed from MachineDay only (the
 * machine data the Match tab's uploads maintain). The table holds at most two
 * rows per day, so one fetch + in-memory aggregation is cheaper than several
 * grouped queries against Neon.
 */
export async function getBranchPerformance(
  month: string,
): Promise<BranchPerformance> {
  const rows = await prisma.machineDay.findMany({
    orderBy: { date: "asc" },
    select: { branch: true, date: true, revenue: true, txnCount: true },
  });

  const prevMonth = shiftMonth(month, -1);
  const branches: Record<1 | 2, BranchMonthStats> = {
    1: emptyStats(),
    2: emptyStats(),
  };
  const dailyMap = new Map<string, { b1: number | null; b2: number | null }>();
  const monthlyMap = new Map<
    string,
    { b1: number | null; b2: number | null }
  >();
  const weekdaySums: Record<1 | 2, { sum: number; count: number }[]> = {
    1: DOW_LABELS.map(() => ({ sum: 0, count: 0 })),
    2: DOW_LABELS.map(() => ({ sum: 0, count: 0 })),
  };

  for (const row of rows) {
    if (row.branch !== 1 && row.branch !== 2) continue;
    const branch = row.branch as 1 | 2;
    const iso = row.date.toISOString().slice(0, 10);
    const ym = iso.slice(0, 7);
    const stats = branches[branch];
    stats.hasAnyData = true;

    const monthAgg = monthlyMap.get(ym) ?? { b1: null, b2: null };
    monthAgg[branch === 1 ? "b1" : "b2"] =
      (monthAgg[branch === 1 ? "b1" : "b2"] ?? 0) + row.revenue;
    monthlyMap.set(ym, monthAgg);

    // Mon-first index (getUTCDay: 0 = Sunday)
    const dow = (row.date.getUTCDay() + 6) % 7;
    weekdaySums[branch][dow].sum += row.revenue;
    weekdaySums[branch][dow].count += 1;

    if (ym === prevMonth) stats.prevRevenue += row.revenue;

    if (ym === month) {
      stats.revenue += row.revenue;
      stats.orders += row.txnCount;
      stats.activeDays += 1;
      if (!stats.bestDay || row.revenue > stats.bestDay.revenue) {
        stats.bestDay = { date: iso, revenue: row.revenue };
      }
      const day = dailyMap.get(iso) ?? { b1: null, b2: null };
      day[branch === 1 ? "b1" : "b2"] = row.revenue;
      dailyMap.set(iso, day);
    }
  }

  for (const branch of [1, 2] as const) {
    const stats = branches[branch];
    stats.avgPerDay =
      stats.activeDays > 0 ? stats.revenue / stats.activeDays : null;
    stats.pctChange =
      stats.prevRevenue > 0
        ? ((stats.revenue - stats.prevRevenue) / stats.prevRevenue) * 100
        : null;
  }

  return {
    month,
    prevMonth,
    nextMonth: shiftMonth(month, 1),
    branches,
    daily: Array.from(dailyMap.entries())
      .map(([date, v]) => ({ date, ...v }))
      .sort((a, b) => a.date.localeCompare(b.date)),
    monthly: Array.from(monthlyMap.entries())
      .map(([m, v]) => ({ month: m, ...v }))
      .sort((a, b) => a.month.localeCompare(b.month)),
    weekday: DOW_LABELS.map((dow, i) => ({
      dow,
      b1:
        weekdaySums[1][i].count > 0
          ? weekdaySums[1][i].sum / weekdaySums[1][i].count
          : null,
      b2:
        weekdaySums[2][i].count > 0
          ? weekdaySums[2][i].sum / weekdaySums[2][i].count
          : null,
    })),
  };
}
