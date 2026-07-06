import "server-only";
import { prisma } from "@/lib/db";
import { DENOMINATIONS } from "@/lib/denominations";
import { DENOM_COLORS, OTHER_COLOR } from "@/lib/chartColors";
import { computeProjections } from "@/lib/projections";
import { getRecentSessions } from "@/lib/data/sessions";

export async function getDashboardStats() {
  const [aggregate, sessionCount, lastSession, allSessions] = await Promise.all([
    prisma.collectionSession.aggregate({ _sum: { totalBaht: true } }),
    prisma.collectionSession.count(),
    prisma.collectionSession.findFirst({ orderBy: { date: "desc" } }),
    prisma.collectionSession.findMany({
      orderBy: { date: "asc" },
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
    }),
  ]);

  const totalCollected = aggregate._sum.totalBaht ?? 0;
  const averagePerSession = sessionCount > 0 ? totalCollected / sessionCount : null;

  const today = new Date();
  const daysSinceLastCollection = lastSession
    ? Math.round(
        (today.getTime() - lastSession.date.getTime()) / (1000 * 60 * 60 * 24),
      )
    : null;

  let averageDaysBetweenCollections: number | null = null;
  if (allSessions.length >= 2) {
    const gaps: number[] = [];
    for (let i = 1; i < allSessions.length; i++) {
      gaps.push(
        Math.round(
          (allSessions[i].date.getTime() - allSessions[i - 1].date.getTime()) /
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

  const perSessionSeries = allSessions.slice(-20).map((s) => ({
    date: s.date.toISOString().slice(0, 10),
    totalBaht: s.totalBaht,
  }));

  return {
    totalCollected,
    sessionCount,
    lastSessionDate: lastSession?.date ?? null,
    daysSinceLastCollection,
    averagePerSession,
    averageDaysBetweenCollections,
    denominationMix,
    monthlyTotals,
    perSessionSeries,
  };
}

export async function getProjections() {
  const recent = await getRecentSessions(10);
  return computeProjections(
    recent.map((s) => ({ date: s.date, totalBaht: s.totalBaht })),
    new Date(),
  );
}
