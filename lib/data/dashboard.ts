import "server-only";
import { prisma } from "@/lib/db";
import { DENOMINATIONS, computeSmallCoinTotal } from "@/lib/denominations";
import { DENOM_COLORS, OTHER_COLOR } from "@/lib/chartColors";
import { computeProjections } from "@/lib/projections";
import { ictNow, todayIct } from "@/lib/ict";

/**
 * Group sessions into per-day totals (multiple same-day sessions of different
 * kinds count as one collection day). Returned ascending by date.
 */
function toDailyTotals(sessions: { date: Date; totalBaht: number }[]) {
  const byDay = new Map<string, { date: Date; totalBaht: number }>();
  for (const s of sessions) {
    const key = s.date.toISOString().slice(0, 10);
    const existing = byDay.get(key);
    if (existing) {
      existing.totalBaht += s.totalBaht;
    } else {
      byDay.set(key, { date: s.date, totalBaht: s.totalBaht });
    }
  }
  return Array.from(byDay.values()).sort(
    (a, b) => a.date.getTime() - b.date.getTime(),
  );
}

async function getAllSessions() {
  return prisma.collectionSession.findMany({
    orderBy: [{ date: "asc" }, { createdAt: "asc" }],
    select: {
      date: true,
      totalBaht: true,
      note1000: true,
      note500: true,
      note100: true,
      note50: true,
      note20: true,
      coin10: true,
      coin5: true,
      coin2: true,
      coin1: true,
    },
  });
}

export async function getUnpaidSummary() {
  const result = await prisma.collectionSession.aggregate({
    where: { paid: false },
    _sum: { totalBaht: true, coin5: true, coin2: true, coin1: true },
    _count: true,
  });
  const unpaidTotal = result._sum.totalBaht ?? 0;
  const unpaidSmallCoins = computeSmallCoinTotal({
    coin5: result._sum.coin5 ?? 0,
    coin2: result._sum.coin2 ?? 0,
    coin1: result._sum.coin1 ?? 0,
  });
  return {
    unpaidTotal,
    unpaidCount: result._count,
    unpaidExclCoins: unpaidTotal - unpaidSmallCoins,
  };
}

const WEEKDAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export async function getDashboardStats() {
  const allSessions = await getAllSessions();
  const dailyTotals = toDailyTotals(allSessions);

  const totalCollected = allSessions.reduce((sum, s) => sum + s.totalBaht, 0);
  const sessionCount = allSessions.length;
  const dayCount = dailyTotals.length;
  const averagePerDay = dayCount > 0 ? totalCollected / dayCount : null;

  const lastDay = dailyTotals[dailyTotals.length - 1] ?? null;
  // Whole days between the stored date-only value and today in Thailand, so a
  // collection made this morning reads 0 all day (not 1 after the UTC cutoff).
  const todayMidnight = new Date(`${todayIct()}T00:00:00.000Z`);
  const daysSinceLastCollection = lastDay
    ? Math.round(
        (todayMidnight.getTime() - lastDay.date.getTime()) /
          (1000 * 60 * 60 * 24),
      )
    : null;

  let averageDaysBetweenCollections: number | null = null;
  if (dailyTotals.length >= 2) {
    const gaps: number[] = [];
    for (let i = 1; i < dailyTotals.length; i++) {
      gaps.push(
        Math.round(
          (dailyTotals[i].date.getTime() - dailyTotals[i - 1].date.getTime()) /
            (1000 * 60 * 60 * 24),
        ),
      );
    }
    averageDaysBetweenCollections =
      gaps.reduce((a, b) => a + b, 0) / gaps.length;
  }

  const rawDenomValues = DENOMINATIONS.map((d) => ({
    key: d.key,
    label: `${d.kind === "note" ? "Notes" : "Coins"} ฿${d.label}`,
    value: allSessions.reduce((sum, s) => sum + s[d.key] * d.value, 0),
  }));

  const otherValue = rawDenomValues
    .filter((d) => !DENOM_COLORS[d.key])
    .reduce((sum, d) => sum + d.value, 0);

  const denominationMix = [
    ...rawDenomValues
      .filter((d) => DENOM_COLORS[d.key] && d.value > 0)
      .map((d) => ({ label: d.label, value: d.value, color: DENOM_COLORS[d.key]! })),
    ...(otherValue > 0
      ? [{ label: "Other", value: otherValue, color: OTHER_COLOR }]
      : []),
  ];

  const monthlyTotalsMap = new Map<string, number>();
  for (const s of allSessions) {
    // Dates are stored as UTC date-only values; bucket by UTC, never server-local.
    const key = s.date.toISOString().slice(0, 7);
    monthlyTotalsMap.set(key, (monthlyTotalsMap.get(key) ?? 0) + s.totalBaht);
  }
  const monthlyTotals = Array.from(monthlyTotalsMap.entries()).map(
    ([month, total]) => ({ month, total }),
  );

  const dailySeries = dailyTotals.slice(-20).map((d) => ({
    date: d.date.toISOString().slice(0, 10),
    totalBaht: d.totalBaht,
  }));

  // Records: computed from data already in memory.
  const bestDay = dailyTotals.reduce(
    (best, d) => (best === null || d.totalBaht > best.totalBaht ? d : best),
    null as { date: Date; totalBaht: number } | null,
  );
  const bestMonth = monthlyTotals.reduce(
    (best, m) => (best === null || m.total > best.total ? m : best),
    null as { month: string; total: number } | null,
  );
  const biggestSession = allSessions.reduce(
    (best, s) => (best === null || s.totalBaht > best.totalBaht ? s : best),
    null as { date: Date; totalBaht: number } | null,
  );

  // Best day of week: mean daily total per weekday (UTC — dates are date-only).
  let bestWeekday: {
    weekday: string;
    avg: number;
    pctAboveOverall: number;
  } | null = null;
  if (dailyTotals.length >= 8 && averagePerDay) {
    const byWeekday = new Map<number, { sum: number; n: number }>();
    for (const d of dailyTotals) {
      const wd = d.date.getUTCDay();
      const agg = byWeekday.get(wd) ?? { sum: 0, n: 0 };
      agg.sum += d.totalBaht;
      agg.n += 1;
      byWeekday.set(wd, agg);
    }
    let top: { wd: number; avg: number } | null = null;
    for (const [wd, agg] of byWeekday) {
      const avg = agg.sum / agg.n;
      if (top === null || avg > top.avg) top = { wd, avg };
    }
    if (top) {
      bestWeekday = {
        weekday: WEEKDAY_NAMES[top.wd],
        avg: top.avg,
        pctAboveOverall: ((top.avg - averagePerDay) / averagePerDay) * 100,
      };
    }
  }

  const allDailyTotals = dailyTotals.map((d) => ({
    date: d.date.toISOString().slice(0, 10),
    totalBaht: d.totalBaht,
  }));

  return {
    records: {
      bestDay: bestDay
        ? { date: bestDay.date, totalBaht: bestDay.totalBaht }
        : null,
      bestMonth,
      biggestSession: biggestSession
        ? { date: biggestSession.date, totalBaht: biggestSession.totalBaht }
        : null,
    },
    bestWeekday,
    allDailyTotals,
    totalCollected,
    sessionCount,
    dayCount,
    lastCollectionDate: lastDay?.date ?? null,
    daysSinceLastCollection,
    averagePerDay,
    averageDaysBetweenCollections,
    denominationMix,
    monthlyTotals,
    dailySeries,
  };
}

export async function getProjections() {
  const allSessions = await prisma.collectionSession.findMany({
    orderBy: { date: "asc" },
    select: { date: true, totalBaht: true },
  });
  const dailyTotals = toDailyTotals(allSessions);
  return computeProjections(dailyTotals.slice(-10), ictNow());
}
