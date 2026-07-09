import "server-only";
import { prisma } from "@/lib/db";
import { parseMachineCsv } from "@/lib/machineCsv";

function toDateOnlyUtc(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00.000Z`);
}

export interface ImportSummary {
  branch: number;
  format: string;
  daysImported: number;
  totalRevenue: number;
  totalTxns: number;
  skipped: number;
  firstDate: string | null;
  lastDate: string | null;
}

/**
 * Parse a washclub CSV and upsert one MachineDay row per day for the given
 * branch. Idempotent: re-importing a range replaces those days' totals.
 */
export async function importMachineCsv(
  branch: number,
  csvText: string,
): Promise<ImportSummary> {
  const parsed = parseMachineCsv(csvText);

  for (const day of parsed.days) {
    const date = toDateOnlyUtc(day.date);
    await prisma.machineDay.upsert({
      where: { branch_date: { branch, date } },
      create: { branch, date, revenue: day.revenue, txnCount: day.txnCount },
      update: { revenue: day.revenue, txnCount: day.txnCount },
    });
  }

  // Per-transaction timestamps (transactional formats only). Replace this
  // branch's transactions for the covered days so re-imports stay idempotent.
  // Summary backfills carry no txns and therefore never touch existing ones.
  if (parsed.txns.length > 0 && parsed.days.length > 0) {
    const first = new Date(`${parsed.days[0].date}T00:00:00.000Z`);
    const lastExclusive = new Date(
      new Date(
        `${parsed.days[parsed.days.length - 1].date}T00:00:00.000Z`,
      ).getTime() +
        24 * 60 * 60 * 1000,
    );
    await prisma.$transaction([
      prisma.machineTxn.deleteMany({
        where: { branch, occurredAt: { gte: first, lt: lastExclusive } },
      }),
      prisma.machineTxn.createMany({
        data: parsed.txns.map((t) => ({
          branch,
          occurredAt: new Date(`${t.at}.000Z`),
          amount: t.amount,
        })),
      }),
    ]);
  }

  return {
    branch,
    format: parsed.format,
    daysImported: parsed.days.length,
    totalRevenue: parsed.totalRevenue,
    totalTxns: parsed.totalTxns,
    skipped: parsed.skipped,
    firstDate: parsed.days[0]?.date ?? null,
    lastDate: parsed.days[parsed.days.length - 1]?.date ?? null,
  };
}

/**
 * Delete imported machine days for a branch — a single date (YYYY-MM-DD) if
 * given, otherwise all of them. Stored transactions for the same scope go
 * with them. Returns day rows removed.
 */
export async function clearMachineData(
  branch: number,
  date?: string,
): Promise<number> {
  const txnWhere = date
    ? {
        occurredAt: {
          gte: toDateOnlyUtc(date),
          lt: new Date(toDateOnlyUtc(date).getTime() + 24 * 60 * 60 * 1000),
        },
      }
    : {};
  const [days] = await prisma.$transaction([
    prisma.machineDay.deleteMany({
      where: { branch, ...(date ? { date: toDateOnlyUtc(date) } : {}) },
    }),
    prisma.machineTxn.deleteMany({ where: { branch, ...txnWhere } }),
  ]);
  return days.count;
}

export interface BranchStatus {
  branch: number;
  dayCount: number;
  firstDate: string | null;
  lastDate: string | null;
  totalRevenue: number;
}

export async function getMachineStatus(): Promise<BranchStatus[]> {
  const out: BranchStatus[] = [];
  for (const branch of [1, 2]) {
    const [agg, first, last] = await Promise.all([
      prisma.machineDay.aggregate({
        where: { branch },
        _sum: { revenue: true },
        _count: true,
      }),
      prisma.machineDay.findFirst({
        where: { branch },
        orderBy: { date: "asc" },
        select: { date: true },
      }),
      prisma.machineDay.findFirst({
        where: { branch },
        orderBy: { date: "desc" },
        select: { date: true },
      }),
    ]);
    out.push({
      branch,
      dayCount: agg._count,
      firstDate: first?.date.toISOString().slice(0, 10) ?? null,
      lastDate: last?.date.toISOString().slice(0, 10) ?? null,
      totalRevenue: agg._sum.revenue ?? 0,
    });
  }
  return out;
}
