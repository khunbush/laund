import "server-only";
import { prisma } from "@/lib/db";
import { DENOMINATIONS } from "@/lib/denominations";
import { DENOM_COLORS, OTHER_COLOR } from "@/lib/chartColors";
import { computeProjections } from "@/lib/projections";

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

export async function getDashboardStats() {
  const allSessions = await getAllSessions();
  const dailyTotals = toDailyTotals(allSessions);

  const totalCollected = allSessions.reduce((sum, s) => sum + s.totalBaht, 0);
  const sessionCount = allSessions.length;
  const dayCount = dailyTotals.length;
  const averagePerDay = dayCount > 0 ? totalCollected / dayCount : null;

  const lastDay = dailyTotals[dailyTotals.length - 1] ?? null;
  const today = new Date();
  const daysSinceLastCollection = lastDay
    ? Math.round(
        (today.getTime() - lastDay.date.getTime()) / (1000 * 60 * 60 * 24),
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
    const key = `${s.date.getFullYear()}-${String(s.date.getMonth() + 1).padStart(2, "0")}`;
    monthlyTotalsMap.set(key, (monthlyTotalsMap.get(key) ?? 0) + s.totalBaht);
  }
  const monthlyTotals = Array.from(monthlyTotalsMap.entries()).map(
    ([month, total]) => ({ month, total }),
  );

  const dailySeries = dailyTotals.slice(-20).map((d) => ({
    date: d.date.toISOString().slice(0, 10),
    totalBaht: d.totalBaht,
  }));

  return {
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
  return computeProjections(dailyTotals.slice(-10), new Date());
}
