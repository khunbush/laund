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
