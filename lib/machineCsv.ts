// Parses a washclub machine-report CSV into per-day revenue totals.
// Two known formats are auto-detected from the header row:
//
//  Branch 1 (washclub):    No,startDate,startTime,endDate,endTime,Amount
//                          dates Gregorian (7/7/2026), amount = Amount
//  Branch 2 (washclub v2): เลขอ้างอิง,เวลาที่ทำรายการ,ประเภทงาน,เครื่อง/พนักงาน,สถานะ,ยอดชำระ,ชำระด้วย
//                          datetime with Buddhist year (7/7/2569), amount = ยอดชำระ,
//                          only rows with สถานะ = สำเร็จ (success) count.

export interface MachineDayTotal {
  date: string; // YYYY-MM-DD
  revenue: number;
  txnCount: number;
}

export interface ParseResult {
  format: "branch1" | "branch2";
  days: MachineDayTotal[];
  totalRevenue: number;
  totalTxns: number;
  skipped: number; // rows ignored (bad date/amount, or non-success)
}

const THAI_SUCCESS = "สำเร็จ";

function splitCsvLine(line: string): string[] {
  // Simple CSV split — these reports have no quoted/embedded commas.
  return line.split(",").map((c) => c.trim());
}

/**
 * Parse a "M/D/Y" or "D/M/Y" date whose year may be Buddhist (>2500).
 * Order is resolved per-file by the caller; here we take an explicit
 * dayFirst flag. Returns YYYY-MM-DD (Gregorian) or null.
 */
function parseDate(datePart: string, dayFirst: boolean): string | null {
  const m = datePart.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (!m) return null;
  let a = Number(m[1]);
  let b = Number(m[2]);
  let year = Number(m[3]);
  if (year > 2500) year -= 543; // Buddhist -> Gregorian
  const day = dayFirst ? a : b;
  const month = dayFirst ? b : a;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/**
 * Decide day-vs-month order from all date cells: if any first-part > 12 it must
 * be day-first; if any second-part > 12 it must be month-first. Falls back to
 * the format default when a file spans only ambiguous dates (both parts <= 12).
 */
function detectDayFirst(dateParts: string[], defaultDayFirst: boolean): boolean {
  let firstOver = false;
  let secondOver = false;
  for (const p of dateParts) {
    const m = p.match(/^(\d{1,2})\/(\d{1,2})\//);
    if (!m) continue;
    if (Number(m[1]) > 12) firstOver = true;
    if (Number(m[2]) > 12) secondOver = true;
  }
  if (firstOver && !secondOver) return true;
  if (secondOver && !firstOver) return false;
  return defaultDayFirst;
}

export function parseMachineCsv(csvText: string): ParseResult {
  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  if (lines.length < 2) {
    return { format: "branch1", days: [], totalRevenue: 0, totalTxns: 0, skipped: 0 };
  }

  const header = splitCsvLine(lines[0]);
  const isBranch2 = header.some((h) => h.includes("ยอดชำระ"));

  const rows = lines.slice(1).map(splitCsvLine);
  const byDay = new Map<string, { revenue: number; txnCount: number }>();
  let skipped = 0;

  if (isBranch2) {
    // columns by header name
    const idxDate = header.findIndex((h) => h.includes("เวลาที่ทำรายการ"));
    const idxAmount = header.findIndex((h) => h.includes("ยอดชำระ"));
    const idxStatus = header.findIndex((h) => h.includes("สถานะ"));
    const dateParts = rows
      .map((r) => (r[idxDate] ?? "").split(/\s+/)[0])
      .filter(Boolean);
    const dayFirst = detectDayFirst(dateParts, true); // Thai default D/M/Y

    for (const r of rows) {
      if (idxStatus >= 0 && r[idxStatus] !== THAI_SUCCESS) {
        skipped++;
        continue;
      }
      const datePart = (r[idxDate] ?? "").split(/\s+/)[0];
      const date = parseDate(datePart, dayFirst);
      const amount = Number(r[idxAmount]);
      if (!date || !Number.isFinite(amount)) {
        skipped++;
        continue;
      }
      const agg = byDay.get(date) ?? { revenue: 0, txnCount: 0 };
      agg.revenue += Math.round(amount);
      agg.txnCount += 1;
      byDay.set(date, agg);
    }

    return finalize("branch2", byDay, skipped);
  }

  // Branch 1
  const idxDate = header.findIndex((h) => h.toLowerCase() === "startdate");
  const idxAmount = header.findIndex((h) => h.toLowerCase() === "amount");
  const dateCol = idxDate >= 0 ? idxDate : 1;
  const amountCol = idxAmount >= 0 ? idxAmount : header.length - 1;
  const dateParts = rows.map((r) => r[dateCol] ?? "").filter(Boolean);
  const dayFirst = detectDayFirst(dateParts, false); // US default M/D/Y

  for (const r of rows) {
    const date = parseDate(r[dateCol] ?? "", dayFirst);
    const amount = Number(r[amountCol]);
    if (!date || !Number.isFinite(amount)) {
      skipped++;
      continue;
    }
    const agg = byDay.get(date) ?? { revenue: 0, txnCount: 0 };
    agg.revenue += Math.round(amount);
    agg.txnCount += 1;
    byDay.set(date, agg);
  }

  return finalize("branch1", byDay, skipped);
}

function finalize(
  format: "branch1" | "branch2",
  byDay: Map<string, { revenue: number; txnCount: number }>,
  skipped: number,
): ParseResult {
  const days = Array.from(byDay.entries())
    .map(([date, v]) => ({ date, revenue: v.revenue, txnCount: v.txnCount }))
    .sort((a, b) => a.date.localeCompare(b.date));
  return {
    format,
    days,
    totalRevenue: days.reduce((s, d) => s + d.revenue, 0),
    totalTxns: days.reduce((s, d) => s + d.txnCount, 0),
    skipped,
  };
}
