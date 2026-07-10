// Parses a washclub machine-report CSV into per-day revenue totals.
// Three known formats are auto-detected from the header row:
//
//  Branch 1 (washclub):    No,startDate,startTime,endDate,endTime,Amount
//                          dates Gregorian (7/7/2026), amount = Amount
//  Branch 2 (washclub v2): เลขอ้างอิง,เวลาที่ทำรายการ,ประเภทงาน,เครื่อง/พนักงาน,สถานะ,ยอดชำระ,ชำระด้วย
//                          datetime with Buddhist year (7/7/2569), amount = ยอดชำระ,
//                          only rows with สถานะ = สำเร็จ (success) count.
//  Daily summary:          Date / วันที่, ..., Total / รวม, Orders / จำนวนออเดอร์, ...
//                          one pre-aggregated row per day (used for historical
//                          backfills); revenue = Total column, txnCount = Orders.

export interface MachineDayTotal {
  date: string; // YYYY-MM-DD
  revenue: number;
  txnCount: number;
}

export interface MachineTxnRow {
  at: string; // YYYY-MM-DDTHH:mm:ss — local (ICT) wall-clock time
  amount: number;
}

export interface ParseResult {
  format: "branch1" | "branch2" | "summary";
  days: MachineDayTotal[];
  // Per-transaction timestamps, only for the transactional formats (empty for
  // daily summaries). Rows whose time cell is missing/unparseable are omitted
  // here but still counted in the day totals.
  txns: MachineTxnRow[];
  totalRevenue: number;
  totalTxns: number;
  skipped: number; // rows ignored (bad date/amount, or non-success)
}

const THAI_SUCCESS = "สำเร็จ";

/**
 * Parse a time cell to HH:mm:ss (24h). Accepts "11:20:58 PM" (branch 1) and
 * "14:23" / "14:23:05" (branch 2). Returns null when unparseable.
 */
function parseTime(raw: string): string | null {
  const m = raw
    .trim()
    .match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\s*(AM|PM))?$/i);
  if (!m) return null;
  let hour = Number(m[1]);
  const minute = Number(m[2]);
  const second = m[3] ? Number(m[3]) : 0;
  const meridiem = m[4]?.toUpperCase();
  if (meridiem === "PM" && hour < 12) hour += 12;
  if (meridiem === "AM" && hour === 12) hour = 0;
  if (hour > 23 || minute > 59 || second > 59) return null;
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(hour)}:${p(minute)}:${p(second)}`;
}

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
  const iso = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  // Reject impossible calendar dates (Feb 31, 2-digit years, …) so bad rows
  // are skipped instead of an Invalid Date crashing the DB write later.
  const parsed = new Date(`${iso}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== iso) {
    return null;
  }
  return iso;
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
    return {
      format: "branch1",
      days: [],
      txns: [],
      totalRevenue: 0,
      totalTxns: 0,
      skipped: 0,
    };
  }

  const header = splitCsvLine(lines[0]);
  const isBranch2 = header.some((h) => h.includes("ยอดชำระ"));
  const isSummary =
    !isBranch2 &&
    header.some((h) => /total|รวม/i.test(h)) &&
    header.some((h) => /order|ออเดอร์/i.test(h));

  const rows = lines.slice(1).map(splitCsvLine);
  const byDay = new Map<string, { revenue: number; txnCount: number }>();
  const txns: MachineTxnRow[] = [];
  let skipped = 0;

  if (isSummary) {
    const idxHeader = (re: RegExp, fallback: number) => {
      const i = header.findIndex((h) => re.test(h));
      return i >= 0 ? i : fallback;
    };
    const idxDate = idxHeader(/date|วันที่/i, 0);
    const idxRevenue = idxHeader(/total|รวม/i, 1);
    const idxOrders = idxHeader(/order|ออเดอร์/i, 2);
    const dayFirst = detectDayFirst(
      rows.map((r) => r[idxDate] ?? "").filter(Boolean),
      true,
    );

    for (const r of rows) {
      const raw = (r[idxDate] ?? "").split(/\s+/)[0];
      const date = /^\d{4}-\d{2}-\d{2}$/.test(raw)
        ? raw
        : parseDate(raw, dayFirst);
      const revenue = Number(r[idxRevenue]);
      const orders = Number(r[idxOrders]);
      if (!date || !Number.isFinite(revenue)) {
        skipped++;
        continue;
      }
      const agg = byDay.get(date) ?? { revenue: 0, txnCount: 0 };
      agg.revenue += Math.round(revenue);
      agg.txnCount += Number.isFinite(orders) ? Math.round(orders) : 0;
      byDay.set(date, agg);
    }

    return finalize("summary", byDay, skipped);
  }

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
      const cellParts = (r[idxDate] ?? "").split(/\s+/);
      const date = parseDate(cellParts[0], dayFirst);
      const amount = Number(r[idxAmount]);
      if (!date || !Number.isFinite(amount)) {
        skipped++;
        continue;
      }
      const agg = byDay.get(date) ?? { revenue: 0, txnCount: 0 };
      agg.revenue += Math.round(amount);
      agg.txnCount += 1;
      byDay.set(date, agg);
      const time = parseTime(cellParts.slice(1).join(" "));
      if (time) txns.push({ at: `${date}T${time}`, amount: Math.round(amount) });
    }

    return finalize("branch2", byDay, skipped, txns);
  }

  // Branch 1
  const idxDate = header.findIndex((h) => h.toLowerCase() === "startdate");
  const idxTime = header.findIndex((h) => h.toLowerCase() === "starttime");
  const idxAmount = header.findIndex((h) => h.toLowerCase() === "amount");
  const dateCol = idxDate >= 0 ? idxDate : 1;
  const timeCol = idxTime >= 0 ? idxTime : dateCol + 1;
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
    const time = parseTime(r[timeCol] ?? "");
    if (time) txns.push({ at: `${date}T${time}`, amount: Math.round(amount) });
  }

  return finalize("branch1", byDay, skipped, txns);
}

function finalize(
  format: ParseResult["format"],
  byDay: Map<string, { revenue: number; txnCount: number }>,
  skipped: number,
  txns: MachineTxnRow[] = [],
): ParseResult {
  const days = Array.from(byDay.entries())
    .map(([date, v]) => ({ date, revenue: v.revenue, txnCount: v.txnCount }))
    .sort((a, b) => a.date.localeCompare(b.date));
  return {
    format,
    days,
    txns,
    totalRevenue: days.reduce((s, d) => s + d.revenue, 0),
    totalTxns: days.reduce((s, d) => s + d.txnCount, 0),
    skipped,
  };
}
