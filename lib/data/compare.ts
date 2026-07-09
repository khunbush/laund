import "server-only";
import { prisma } from "@/lib/db";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

// The machines were emptied (uncounted) on 2026-07-03, the day before
// collection tracking began. Machine data older than this exists only as a
// historical backfill for the Branches tab and can never correspond to cash
// that was counted, so comparison windows must not reach into it.
const COMPARE_START = "2026-07-04";

function iso(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDays(dateStr: string, n: number): string {
  return iso(new Date(new Date(`${dateStr}T00:00:00Z`).getTime() + n * MS_PER_DAY));
}

function daysBetweenInclusive(startStr: string, endStr: string): number {
  const d =
    (new Date(`${endStr}T00:00:00Z`).getTime() -
      new Date(`${startStr}T00:00:00Z`).getTime()) /
    MS_PER_DAY;
  return Math.max(0, Math.floor(d) + 1);
}

export interface CompareRow {
  dateKey: string; // one row per collection day
  collectedDate: string; // the laundry collection date
  windowStart: string;
  windowEnd: string;
  counted: number; // what you counted
  machineBranch1: number;
  machineBranch2: number;
  machineTotal: number; // expected
  diff: number; // counted - expected (negative = short)
  windowDays: number;
  branch1DaysCovered: number;
  branch2DaysCovered: number;
  isFirst: boolean;
}

export interface ComparePending {
  since: string | null; // day after last collection
  until: string; // today
  machineTotal: number;
  branch1: number;
  branch2: number;
}

export interface CompareResult {
  rows: CompareRow[]; // newest first
  pending: ComparePending | null;
  hasMachineData: boolean;
  totalCounted: number;
  totalMachine: number;
  totalDiff: number;
}

export async function getComparison(): Promise<CompareResult> {
  const [laundry, machineDays] = await Promise.all([
    prisma.collectionSession.findMany({
      where: { kind: "LAUNDRY" },
      orderBy: [{ date: "asc" }, { createdAt: "asc" }],
      select: { id: true, date: true, totalBaht: true },
    }),
    prisma.machineDay.findMany({
      orderBy: { date: "asc" },
      select: { branch: true, date: true, revenue: true },
    }),
  ]);

  const hasMachineData = machineDays.length > 0;
  const earliestMachine = hasMachineData ? iso(machineDays[0].date) : null;
  // Baseline start for windows with no previous collection to anchor on.
  const baselineStart =
    earliestMachine && earliestMachine > COMPARE_START
      ? earliestMachine
      : COMPARE_START;

  // Aggregate laundry collections by DAY: multiple collections on the same date
  // are one collection for matching purposes (their counts sum). This avoids a
  // second same-day session getting a nonsensical "day after the first" window.
  const countedByDay = new Map<string, number>();
  for (const s of laundry) {
    const key = iso(s.date);
    countedByDay.set(key, (countedByDay.get(key) ?? 0) + s.totalBaht);
  }
  const collectionDays = Array.from(countedByDay.entries())
    .map(([date, counted]) => ({ date, counted }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // date -> per-branch revenue
  const byDate = new Map<string, { b1: number; b2: number }>();
  for (const m of machineDays) {
    const key = iso(m.date);
    const agg = byDate.get(key) ?? { b1: 0, b2: 0 };
    if (m.branch === 1) agg.b1 += m.revenue;
    else if (m.branch === 2) agg.b2 += m.revenue;
    byDate.set(key, agg);
  }

  function sumWindow(startStr: string, endStr: string) {
    let b1 = 0;
    let b2 = 0;
    let b1Days = 0;
    let b2Days = 0;
    for (const [date, v] of byDate) {
      if (date >= startStr && date <= endStr) {
        b1 += v.b1;
        b2 += v.b2;
        if (v.b1 > 0) b1Days++;
        if (v.b2 > 0) b2Days++;
      }
    }
    return { b1, b2, b1Days, b2Days };
  }

  const rows: CompareRow[] = [];
  let totalCounted = 0;
  let totalMachine = 0;

  for (let i = 0; i < collectionDays.length; i++) {
    const { date: collectedDate, counted } = collectionDays[i];
    const isFirst = i === 0;
    const prevDate = isFirst ? null : collectionDays[i - 1].date;
    // Window: day after previous collection through this collection date.
    // For the first collection, start from the comparison baseline (earliest
    // machine data, but never before COMPARE_START).
    const windowStart = prevDate
      ? addDays(prevDate, 1)
      : (earliestMachine && baselineStart <= collectedDate
          ? baselineStart
          : collectedDate);
    const windowEnd = collectedDate;

    const w = sumWindow(windowStart, windowEnd);
    const machineTotal = w.b1 + w.b2;

    rows.push({
      dateKey: collectedDate,
      collectedDate,
      windowStart,
      windowEnd,
      counted,
      machineBranch1: w.b1,
      machineBranch2: w.b2,
      machineTotal,
      diff: counted - machineTotal,
      windowDays: daysBetweenInclusive(windowStart, windowEnd),
      branch1DaysCovered: w.b1Days,
      branch2DaysCovered: w.b2Days,
      isFirst,
    });

    // Only fold into all-time totals when there was machine data in the window.
    if (machineTotal > 0) {
      totalCounted += counted;
      totalMachine += machineTotal;
    }
  }

  // Pending: machine revenue since the last collection that you haven't counted yet.
  let pending: ComparePending | null = null;
  if (hasMachineData) {
    const today = iso(new Date());
    const lastCollection = collectionDays.length
      ? collectionDays[collectionDays.length - 1].date
      : null;
    const since = lastCollection ? addDays(lastCollection, 1) : baselineStart;
    if (since && since <= today) {
      const w = sumWindow(since, today);
      pending = {
        since,
        until: today,
        machineTotal: w.b1 + w.b2,
        branch1: w.b1,
        branch2: w.b2,
      };
    }
  }

  return {
    rows: rows.reverse(), // newest first
    pending,
    hasMachineData,
    totalCounted,
    totalMachine,
    totalDiff: totalCounted - totalMachine,
  };
}
