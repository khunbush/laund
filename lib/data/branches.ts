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
  // Same-day comparison: previous month's revenue counted only through the
  // latest day-of-month that has data in the selected month, so a mid-month
  // month-to-date figure is compared against an equal slice of last month.
  sameDayCutoff: number | null; // day-of-month the slice runs through
  prevRevenueSameDay: number;
  pctChangeSameDay: number | null;
  hasAnyData: boolean; // whether this branch has rows in any month
}

export interface BranchPerformance {
  month: string;
  prevMonth: string;
  nextMonth: string;
  branches: Record<1 | 2, BranchMonthStats>;
  // Both branches folded together (bestDay = best combined day, activeDays =
  // days where either branch has data).
  combined: BranchMonthStats;
  // One entry per day of the selected month that has data for either branch;
  // null = that branch has no row for the day (distinct from a real ฿0 day).
  daily: { date: string; b1: number | null; b2: number | null }[];
  monthly: { month: string; b1: number | null; b2: number | null }[];
  weekday: { dow: string; b1: number | null; b2: number | null }[];
  // Revenue by hour of day (00-23, ICT), summed over all stored transactions.
  // Transaction timestamps only accumulate from daily agent uploads.
  hourly: { hour: string; b1: number | null; b2: number | null }[];
  txnSince: string | null; // earliest transaction date, null when none stored
}

const DOW_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function iso(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function emptyStats(): BranchMonthStats {
  return {
    revenue: 0,
    orders: 0,
    activeDays: 0,
    avgPerDay: null,
    bestDay: null,
    prevRevenue: 0,
    pctChange: null,
    sameDayCutoff: null,
    prevRevenueSameDay: 0,
    pctChangeSameDay: null,
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
  const [rows, txnHours, txnFirst] = await Promise.all([
    prisma.machineDay.findMany({
      orderBy: { date: "asc" },
      select: { branch: true, date: true, revenue: true, txnCount: true },
    }),
    // Aggregate in SQL: the txn table grows by ~100 rows per day forever, so
    // fetching every row just to fill 24 hour buckets gets slower each month.
    // date_part reads the stored as-if-UTC wall-clock hour (= getUTCHours).
    prisma.$queryRaw<{ branch: number; hour: number; amount: number }[]>`
      SELECT branch,
             date_part('hour', "occurredAt")::int AS hour,
             SUM(amount)::int AS amount
      FROM "MachineTxn"
      GROUP BY branch, hour
    `,
    prisma.machineTxn.aggregate({ _min: { occurredAt: true } }),
  ]);

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
  // Per-branch prev-month rows kept by day-of-month so the same-day slice can
  // be summed once the selected month's data coverage (max day) is known.
  const prevMonthDays: Record<1 | 2, { day: number; revenue: number }[]> = {
    1: [],
    2: [],
  };
  const maxDataDay: Record<1 | 2, number> = { 1: 0, 2: 0 };

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

    if (ym === prevMonth) {
      stats.prevRevenue += row.revenue;
      prevMonthDays[branch].push({
        day: Number(iso.slice(8, 10)),
        revenue: row.revenue,
      });
    }

    if (ym === month) {
      stats.revenue += row.revenue;
      stats.orders += row.txnCount;
      stats.activeDays += 1;
      maxDataDay[branch] = Math.max(maxDataDay[branch], Number(iso.slice(8, 10)));
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
    if (maxDataDay[branch] > 0) {
      stats.sameDayCutoff = maxDataDay[branch];
      stats.prevRevenueSameDay = prevMonthDays[branch]
        .filter((d) => d.day <= maxDataDay[branch])
        .reduce((sum, d) => sum + d.revenue, 0);
      stats.pctChangeSameDay =
        stats.prevRevenueSameDay > 0
          ? ((stats.revenue - stats.prevRevenueSameDay) /
              stats.prevRevenueSameDay) *
            100
          : null;
    }
  }

  const combined = emptyStats();
  combined.hasAnyData = branches[1].hasAnyData || branches[2].hasAnyData;
  combined.revenue = branches[1].revenue + branches[2].revenue;
  combined.orders = branches[1].orders + branches[2].orders;
  combined.prevRevenue = branches[1].prevRevenue + branches[2].prevRevenue;
  combined.activeDays = dailyMap.size;
  combined.avgPerDay =
    combined.activeDays > 0 ? combined.revenue / combined.activeDays : null;
  combined.pctChange =
    combined.prevRevenue > 0
      ? ((combined.revenue - combined.prevRevenue) / combined.prevRevenue) *
        100
      : null;
  combined.sameDayCutoff =
    Math.max(maxDataDay[1], maxDataDay[2]) > 0
      ? Math.max(maxDataDay[1], maxDataDay[2])
      : null;
  combined.prevRevenueSameDay =
    branches[1].prevRevenueSameDay + branches[2].prevRevenueSameDay;
  combined.pctChangeSameDay =
    combined.sameDayCutoff !== null && combined.prevRevenueSameDay > 0
      ? ((combined.revenue - combined.prevRevenueSameDay) /
          combined.prevRevenueSameDay) *
        100
      : null;
  for (const [date, v] of dailyMap) {
    const dayTotal = (v.b1 ?? 0) + (v.b2 ?? 0);
    if (!combined.bestDay || dayTotal > combined.bestDay.revenue) {
      combined.bestDay = { date, revenue: dayTotal };
    }
  }

  const hourlySums: Record<1 | 2, number[]> = {
    1: Array.from({ length: 24 }, () => 0),
    2: Array.from({ length: 24 }, () => 0),
  };
  const hourlySeen: Record<1 | 2, boolean> = { 1: false, 2: false };
  for (const t of txnHours) {
    if (t.branch !== 1 && t.branch !== 2) continue;
    const branch = t.branch as 1 | 2;
    hourlySums[branch][t.hour] += t.amount;
    hourlySeen[branch] = true;
  }

  return {
    month,
    prevMonth,
    nextMonth: shiftMonth(month, 1),
    branches,
    combined,
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
    hourly: Array.from({ length: 24 }, (_, h) => ({
      hour: String(h).padStart(2, "0"),
      b1: hourlySeen[1] ? hourlySums[1][h] : null,
      b2: hourlySeen[2] ? hourlySums[2][h] : null,
    })),
    txnSince: txnFirst._min.occurredAt ? iso(txnFirst._min.occurredAt) : null,
  };
}
