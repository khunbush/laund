import "server-only";
import { prisma } from "@/lib/db";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

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
  sessionId: string;
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

  for (let i = 0; i < laundry.length; i++) {
    const s = laundry[i];
    const collectedDate = iso(s.date);
    const isFirst = i === 0;
    const prevDate = isFirst ? null : iso(laundry[i - 1].date);
    // Window: day after previous collection through this collection date.
    // For the first collection, start from the earliest machine data we have.
    const windowStart = prevDate
      ? addDays(prevDate, 1)
      : (earliestMachine && earliestMachine <= collectedDate
          ? earliestMachine
          : collectedDate);
    const windowEnd = collectedDate;

    const w = sumWindow(windowStart, windowEnd);
    const machineTotal = w.b1 + w.b2;
    const counted = s.totalBaht;

    rows.push({
      sessionId: s.id,
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
    const lastCollection = laundry.length
      ? iso(laundry[laundry.length - 1].date)
      : null;
    const since = lastCollection ? addDays(lastCollection, 1) : earliestMachine;
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
