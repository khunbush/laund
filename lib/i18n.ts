// App-wide EN/TH strings. The language lives in a plain (non-httpOnly) cookie
// so the settings popup can set it client-side; server components read it via
// lib/i18n-server.ts and client components via components/I18nProvider.tsx.

export type Lang = "en" | "th";

export const LANG_COOKIE = "lang";

export function asLang(value: string | undefined): Lang {
  return value === "th" ? "th" : "en";
}

/** Locale string for toLocaleDateString and friends. */
export function dateLocale(lang: Lang): string {
  return lang === "th" ? "th-TH" : "en-US";
}

const en = {
  // Tab bar
  tabHome: "Home",
  tabHistory: "History",
  tabDashboard: "Dashboard",
  tabMatch: "Match",
  tabBranches: "Branches",

  // Settings popup
  settings: "Settings",
  language: "Language",

  // Session kinds
  kindLaundry: "Laundry",
  kindSnooker: "Snooker",
  kindMisc: "Misc",

  // Home / new session
  newSession: "New Session",
  todaysCollection: "Today's collection",
  sessionSaved: "Session saved.",
  notesSection: "Notes",
  coinsSection: "Coins",
  showBigNotes: "Show 500 / 1000 notes",
  hideBigNotes: "Hide 500 / 1000 notes",
  show2Coins: "Show 2 baht coins",
  hide2Coins: "Hide 2 baht coins",
  noteOptional: "Note (optional)",
  notePlaceholder: "e.g. coin machine jammed",
  saving: "Saving…",
  saveSession: "Save Session · {total} ฿",
  banknote: "Banknote",
  coin: "Coin",

  // History
  history: "History",
  exportCsv: "⬇︎ Export CSV",
  noSessions: "No sessions yet. Log your first collection from Home.",
  breakdown: "Breakdown",
  noDenoms: "No denominations recorded",
  paid: "✓ Paid",
  unpaid: "Unpaid",
  del: "Delete",
  sureTapAgain: "Sure? Tap again",
  deleting: "Deleting…",
  newer: "← Newer",
  older: "Older →",
  pageOf: "Page {p} of {n}",
  allPaidUp: "✓ All paid up",
  notYetPaid: "not yet paid to you",
  exclCoins: "excluding small coins",
  inSmallCoins: "in small coins",
  showAll: "Show all ({n})",
  showLess: "Show less",
  sessions_one: "{n} session",
  sessions_other: "{n} sessions",
  filterAll: "All",
  filterPaid: "Paid",
  filterUnpaid: "Unpaid",
  noSessionsFiltered: "No sessions match this filter.",
  coinsOnly: "Coins",

  // Dashboard
  dashboard: "Dashboard",
  monthlyReport: "Monthly report →",
  totalCollected: "Total Collected",
  avgPerCollectionDay: "Avg / Collection Day",
  days_one: "{n} day",
  days_other: "{n} days",
  dShort: "{n}d",
  daysSinceLast: "Days Since Last",
  avgInterval: "Avg Interval",
  projections: "Projections",
  confNone: "Not enough data yet",
  confLow: "Low confidence",
  confOk: "Good confidence",
  logMoreSessions: "Log a few more sessions to unlock projections.",
  projectedNext: "Projected next collection",
  projectedMonthEnd: "Projected month-end",
  soFar: "{amt} so far",
  thisMonth: "This Month",
  records: "Records 🏆",
  bestDayRow: "Best day",
  bestMonthRow: "Best month",
  biggestSession: "Biggest session",
  bestWeekday: "Best day of week: {day} — avg {amt} ({pct}% vs overall)",
  denominationMix: "Denomination Mix",
  recentSessions: "Recent Sessions",
  viewAll: "View all →",
  perCollectionDay: "Per collection day",
  monthlyTotals: "Monthly totals",
  daily: "Daily",
  monthly: "Monthly",
  noSessionsYet: "No sessions yet.",
  chartTotal: "Total",
  donutEmpty: "Not enough data yet to show a denomination mix.",
  heatLess: "less",
  heatMore: "more",

  // Match / compare
  machineMatch: "Machine Match",
  refresh: "Refresh",
  noMachineData:
    "No machine data yet. Upload a washclub CSV below (or have your agent POST it) to start comparing your counted cash against machine revenue.",
  countedMatched: "Counted (matched)",
  vsMachines: "vs Machines",
  machinesCaption: "machines: {amt}",
  earnedSinceLast: "{amt} earned since your last collection",
  pendingDetail:
    "{from} → {to} · not yet counted (Marina {b1} · LeBush {b2})",
  collectedOn: "Collected {date}",
  firstCollection: "First collection · ",
  exactMatch: "Exact match",
  overBy: "+{amt} over",
  shortBy: "Short {amt}",
  youCounted: "You counted",
  machinesSay: "Machines say",
  noWindowData: "No machine data imported for this window yet.",
  partialData: "⚠ Partial data: ",
  partialBranch: "{name} has {a}/{b} days",
  partialSuffix: ". The comparison may be understated.",
  earlierCollections_one: "{n} earlier collection without machine data ▾",
  earlierCollections_other: "{n} earlier collections without machine data ▾",
  uploadCsv: "Upload machine CSV",
  importCsv: "Import CSV",
  importing: "Importing…",
  importResult: "Imported {branch}: {days} · {amt} · {txns} transactions",
  skippedCount: " · {n} skipped",
  wrongBranchCsv:
    "This file looks like {name}'s export — nothing was imported. Pick {name} and try again.",
  importedSoFar: "Imported so far",
  through: "through {date}",
  noneYet: "none yet",
  clear: "Clear",
  close: "Close",
  clearSingleDay: "Clear a single day",
  clearThisDay: "Clear this day",
  clearing: "Clearing…",
  clearEverything: "Clear everything",
  noDataThatDate: "No data on that date",
  somethingWrong: "Something went wrong",

  // Branches
  bothBranches: "Both branches",
  noMachineDataMonth:
    "No machine data in {month}. Data arrives from the Match tab's CSV uploads.",
  totalRevenue: "Total Revenue",
  monthRevenue: "Month Revenue",
  daysWithData: "{n} days with data",
  vsLastMonthToday: "vs Last Month (today)",
  vsLastMonth: "vs Last Month",
  lastMonthAmt: "{amt} last month",
  byDate: "{amt} by {date}",
  noDataLastMonth: "no data last month",
  avgPerDay: "Avg / Day",
  orders: "Orders",
  perOrder: "≈{amt} / order",
  bestDayCard: "Best Day",
  dailyRevenue: "Daily revenue",
  monthlyRevenue: "Monthly revenue",
  noMachineThisMonth: "No machine data this month.",
  noMachineYet: "No machine data yet.",
  weekdayAvg: "Day of week — average",
  allData: "all data",
  timeOfDay: "Time of day",
  since: "since {date}",
  hourlyEmpty:
    "Hourly data builds up from each new daily upload — check back after the next one.",
  dowMon: "Mon",
  dowTue: "Tue",
  dowWed: "Wed",
  dowThu: "Thu",
  dowFri: "Fri",
  dowSat: "Sat",
  dowSun: "Sun",
  prevMonth: "Previous month",
  nextMonth: "Next month",

  // Report
  noSessionsMonth: "No sessions recorded in {month}.",
  monthTotal: "Month Total",
  byType: "By Type",
  paidVsUnpaid: "Paid vs Unpaid",
  paidAmt: "Paid {amt}",
  unpaidAmt: "Unpaid {amt}",
  collectionDays: "Collection Days",

  // Edit session
  editSession: "Edit Session",
  sessionTotal: "Session total",
  originalTotal: "Original total was {a} — new total is {b}.",
  collectionDate: "Collection date",
  cancel: "Cancel",
  saveChanges: "Save Changes",

  // Login
  enterPasscode: "Enter your passcode to continue",
  passcode: "Passcode",
  unlock: "Unlock",
  checking: "Checking…",
  wrongPasscode: "Incorrect passcode. Try again.",

  // Error page
  errTitle: "Something hiccuped",
  errBody: "That didn't load. Your data is safe — try again.",
  tryAgain: "Try again",
  goHome: "Go home",
};

const th: Record<MsgKey, string> = {
  tabHome: "หน้าแรก",
  tabHistory: "ประวัติ",
  tabDashboard: "ภาพรวม",
  tabMatch: "เทียบยอด",
  tabBranches: "สาขา",

  settings: "ตั้งค่า",
  language: "ภาษา",

  kindLaundry: "ซักผ้า",
  kindSnooker: "สนุกเกอร์",
  kindMisc: "อื่นๆ",

  newSession: "รอบเก็บเงินใหม่",
  todaysCollection: "ยอดเก็บวันนี้",
  sessionSaved: "บันทึกแล้ว",
  notesSection: "ธนบัตร",
  coinsSection: "เหรียญ",
  showBigNotes: "แสดงแบงก์ 500 / 1000",
  hideBigNotes: "ซ่อนแบงก์ 500 / 1000",
  show2Coins: "แสดงเหรียญ 2 บาท",
  hide2Coins: "ซ่อนเหรียญ 2 บาท",
  noteOptional: "หมายเหตุ (ไม่บังคับ)",
  notePlaceholder: "เช่น ตู้หยอดเหรียญค้าง",
  saving: "กำลังบันทึก…",
  saveSession: "บันทึก · {total} ฿",
  banknote: "ธนบัตร",
  coin: "เหรียญ",

  history: "ประวัติ",
  exportCsv: "⬇︎ ส่งออก CSV",
  noSessions: "ยังไม่มีรายการ เริ่มบันทึกรอบแรกได้จากหน้าแรก",
  breakdown: "รายละเอียด",
  noDenoms: "ไม่มีข้อมูลธนบัตร/เหรียญ",
  paid: "✓ จ่ายแล้ว",
  unpaid: "ยังไม่จ่าย",
  del: "ลบ",
  sureTapAgain: "แน่ใจ? แตะอีกครั้ง",
  deleting: "กำลังลบ…",
  newer: "← ใหม่กว่า",
  older: "เก่ากว่า →",
  pageOf: "หน้า {p} จาก {n}",
  allPaidUp: "✓ จ่ายครบแล้ว",
  notYetPaid: "ยังไม่ได้รับเงิน",
  exclCoins: "ไม่รวมเหรียญเล็ก",
  inSmallCoins: "เป็นเหรียญเล็ก",
  showAll: "ดูทั้งหมด ({n})",
  showLess: "แสดงน้อยลง",
  sessions_one: "{n} รายการ",
  sessions_other: "{n} รายการ",
  filterAll: "ทั้งหมด",
  filterPaid: "จ่ายแล้ว",
  filterUnpaid: "ยังไม่จ่าย",
  noSessionsFiltered: "ไม่มีรายการตรงกับตัวกรองนี้",
  coinsOnly: "เหรียญ",

  dashboard: "ภาพรวม",
  monthlyReport: "รายงานรายเดือน →",
  totalCollected: "เก็บทั้งหมด",
  avgPerCollectionDay: "เฉลี่ย/วันเก็บ",
  days_one: "{n} วัน",
  days_other: "{n} วัน",
  dShort: "{n} วัน",
  daysSinceLast: "ห่างจากครั้งล่าสุด",
  avgInterval: "ระยะห่างเฉลี่ย",
  projections: "คาดการณ์",
  confNone: "ข้อมูลยังไม่พอ",
  confLow: "ความแม่นยำต่ำ",
  confOk: "ความแม่นยำดี",
  logMoreSessions: "บันทึกเพิ่มอีกสักหน่อยเพื่อปลดล็อกคาดการณ์",
  projectedNext: "คาดการณ์รอบถัดไป",
  projectedMonthEnd: "คาดการณ์สิ้นเดือน",
  soFar: "ตอนนี้ {amt}",
  thisMonth: "เดือนนี้",
  records: "สถิติ 🏆",
  bestDayRow: "วันที่ดีที่สุด",
  bestMonthRow: "เดือนที่ดีที่สุด",
  biggestSession: "รอบใหญ่ที่สุด",
  bestWeekday: "วันที่ขายดีสุด: {day} — เฉลี่ย {amt} ({pct}% เทียบค่าเฉลี่ยรวม)",
  denominationMix: "สัดส่วนธนบัตร/เหรียญ",
  recentSessions: "รายการล่าสุด",
  viewAll: "ดูทั้งหมด →",
  perCollectionDay: "ต่อวันเก็บ",
  monthlyTotals: "ยอดรายเดือน",
  daily: "รายวัน",
  monthly: "รายเดือน",
  noSessionsYet: "ยังไม่มีข้อมูล",
  chartTotal: "รวม",
  donutEmpty: "ข้อมูลยังไม่พอสำหรับแสดงสัดส่วน",
  heatLess: "น้อย",
  heatMore: "มาก",

  machineMatch: "เทียบยอดเครื่อง",
  refresh: "รีเฟรช",
  noMachineData:
    "ยังไม่มีข้อมูลเครื่อง อัปโหลดไฟล์ CSV ด้านล่างเพื่อเริ่มเทียบยอดเงินที่นับกับรายได้เครื่อง",
  countedMatched: "นับแล้ว (เทียบแล้ว)",
  vsMachines: "เทียบกับเครื่อง",
  machinesCaption: "เครื่อง: {amt}",
  earnedSinceLast: "ได้อีก {amt} ตั้งแต่เก็บครั้งล่าสุด",
  pendingDetail: "{from} → {to} · ยังไม่ได้นับ (Marina {b1} · LeBush {b2})",
  collectedOn: "เก็บเมื่อ {date}",
  firstCollection: "เก็บครั้งแรก · ",
  exactMatch: "ตรงเป๊ะ",
  overBy: "เกิน {amt}",
  shortBy: "ขาด {amt}",
  youCounted: "คุณนับได้",
  machinesSay: "เครื่องบอก",
  noWindowData: "ยังไม่มีข้อมูลเครื่องสำหรับช่วงนี้",
  partialData: "⚠ ข้อมูลไม่ครบ: ",
  partialBranch: "{name} มี {a}/{b} วัน",
  partialSuffix: " ตัวเลขอาจต่ำกว่าจริง",
  earlierCollections_one: "{n} รอบก่อนหน้าที่ไม่มีข้อมูลเครื่อง ▾",
  earlierCollections_other: "{n} รอบก่อนหน้าที่ไม่มีข้อมูลเครื่อง ▾",
  uploadCsv: "อัปโหลด CSV เครื่อง",
  importCsv: "นำเข้า CSV",
  importing: "กำลังนำเข้า…",
  importResult: "นำเข้า {branch}: {days} · {amt} · {txns} รายการ",
  skippedCount: " · ข้าม {n} แถว",
  wrongBranchCsv:
    "ไฟล์นี้ดูเหมือนเป็นของ {name} — ยังไม่ได้นำเข้าอะไร เลือกสาขา {name} แล้วลองใหม่",
  importedSoFar: "นำเข้าแล้ว",
  through: "ถึง {date}",
  noneYet: "ยังไม่มี",
  clear: "ล้าง",
  close: "ปิด",
  clearSingleDay: "ล้างทีละวัน",
  clearThisDay: "ล้างวันที่เลือก",
  clearing: "กำลังล้าง…",
  clearEverything: "ล้างทั้งหมด",
  noDataThatDate: "ไม่มีข้อมูลวันนั้น",
  somethingWrong: "เกิดข้อผิดพลาด",

  bothBranches: "ทั้งสองสาขา",
  noMachineDataMonth:
    "ไม่มีข้อมูลเครื่องใน{month} ข้อมูลมาจากการอัปโหลด CSV ในแท็บเทียบยอด",
  totalRevenue: "รายได้รวม",
  monthRevenue: "รายได้เดือนนี้",
  daysWithData: "มีข้อมูล {n} วัน",
  vsLastMonthToday: "เทียบเดือนก่อน (วันนี้)",
  vsLastMonth: "เทียบเดือนก่อน",
  lastMonthAmt: "เดือนก่อน {amt}",
  byDate: "{amt} ถึง {date}",
  noDataLastMonth: "เดือนก่อนไม่มีข้อมูล",
  avgPerDay: "เฉลี่ย/วัน",
  orders: "ออเดอร์",
  perOrder: "≈{amt}/ออเดอร์",
  bestDayCard: "วันที่ดีที่สุด",
  dailyRevenue: "รายได้รายวัน",
  monthlyRevenue: "รายได้รายเดือน",
  noMachineThisMonth: "เดือนนี้ยังไม่มีข้อมูลเครื่อง",
  noMachineYet: "ยังไม่มีข้อมูลเครื่อง",
  weekdayAvg: "เฉลี่ยตามวันในสัปดาห์",
  allData: "ข้อมูลทั้งหมด",
  timeOfDay: "ช่วงเวลาของวัน",
  since: "ตั้งแต่ {date}",
  hourlyEmpty:
    "ข้อมูลรายชั่วโมงสะสมจากการอัปโหลดรายวัน ลองกลับมาดูหลังการอัปโหลดครั้งถัดไป",
  dowMon: "จ.",
  dowTue: "อ.",
  dowWed: "พ.",
  dowThu: "พฤ.",
  dowFri: "ศ.",
  dowSat: "ส.",
  dowSun: "อา.",
  prevMonth: "เดือนก่อนหน้า",
  nextMonth: "เดือนถัดไป",

  noSessionsMonth: "ไม่มีรายการใน{month}",
  monthTotal: "ยอดรวมเดือน",
  byType: "ตามประเภท",
  paidVsUnpaid: "จ่ายแล้ว vs ยังไม่จ่าย",
  paidAmt: "จ่ายแล้ว {amt}",
  unpaidAmt: "ยังไม่จ่าย {amt}",
  collectionDays: "วันเก็บเงิน",

  editSession: "แก้ไขรายการ",
  sessionTotal: "ยอดรวม",
  originalTotal: "ยอดเดิม {a} — ยอดใหม่ {b}",
  collectionDate: "วันที่เก็บ",
  cancel: "ยกเลิก",
  saveChanges: "บันทึกการแก้ไข",

  enterPasscode: "ใส่รหัสผ่านเพื่อเข้าใช้งาน",
  passcode: "รหัสผ่าน",
  unlock: "ปลดล็อก",
  checking: "กำลังตรวจสอบ…",
  wrongPasscode: "รหัสผ่านไม่ถูกต้อง ลองใหม่อีกครั้ง",

  errTitle: "มีบางอย่างผิดพลาด",
  errBody: "โหลดไม่สำเร็จ ข้อมูลของคุณปลอดภัย — ลองใหม่อีกครั้ง",
  tryAgain: "ลองใหม่",
  goHome: "กลับหน้าแรก",
};

export type MsgKey = keyof typeof en;

const messages: Record<Lang, Record<MsgKey, string>> = { en, th };

export function t(
  lang: Lang,
  key: MsgKey,
  params?: Record<string, string | number>,
): string {
  let out = messages[lang][key];
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      out = out.replaceAll(`{${k}}`, String(v));
    }
  }
  return out;
}

/** Pluralizing t(): picks `<key>_one` / `<key>_other` and fills {n}. */
export function tn(
  lang: Lang,
  key: "sessions" | "days" | "earlierCollections",
  n: number,
  params?: Record<string, string | number>,
): string {
  const full = `${key}_${n === 1 ? "one" : "other"}` as MsgKey;
  return t(lang, full, { n, ...params });
}

export const KIND_KEYS = {
  LAUNDRY: "kindLaundry",
  SNOOKER: "kindSnooker",
  LUMP_SUM: "kindMisc",
} as const;

// Deterministic short-date formatter for CLIENT components. toLocaleDateString
// with "th-TH" differs between Node's ICU (SSR) and the browser's, which
// causes hydration mismatches — so client-rendered date labels use these
// fixed tables instead. Server-only components can keep toLocaleDateString.
const MONTHS_SHORT: Record<Lang, string[]> = {
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  th: ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."],
};
const WEEKDAYS_SHORT: Record<Lang, string[]> = {
  en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  th: ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."],
};

/** "Jul 12" / "12 ก.ค." — stable across server and browser ICU. */
export function monthDay(lang: Lang, d: Date, utc = false): string {
  const mon = MONTHS_SHORT[lang][utc ? d.getUTCMonth() : d.getMonth()];
  const day = utc ? d.getUTCDate() : d.getDate();
  return lang === "th" ? `${day} ${mon}` : `${mon} ${day}`;
}

/** "Sat, Jul 12" / "ส. 12 ก.ค." — stable across server and browser ICU. */
export function shortDate(lang: Lang, d: Date, utc = false): string {
  const wd = WEEKDAYS_SHORT[lang][utc ? d.getUTCDay() : d.getDay()];
  const mon = MONTHS_SHORT[lang][utc ? d.getUTCMonth() : d.getMonth()];
  const day = utc ? d.getUTCDate() : d.getDate();
  return lang === "th" ? `${wd} ${day} ${mon}` : `${wd}, ${mon} ${day}`;
}

/** "Sat, Jul 12, 2026" / "ส. 12 ก.ค. 2569" (Buddhist year) — stable across
 * server and browser ICU. */
export function shortDateYear(lang: Lang, d: Date, utc = false): string {
  const year = utc ? d.getUTCFullYear() : d.getFullYear();
  const base = shortDate(lang, d, utc);
  return lang === "th" ? `${base} ${year + 543}` : `${base}, ${year}`;
}

// Full weekday names as produced by lib/data/dashboard.ts.
const WEEKDAY_TH: Record<string, string> = {
  Sunday: "วันอาทิตย์",
  Monday: "วันจันทร์",
  Tuesday: "วันอังคาร",
  Wednesday: "วันพุธ",
  Thursday: "วันพฤหัสบดี",
  Friday: "วันศุกร์",
  Saturday: "วันเสาร์",
};

export function weekdayLabel(name: string, lang: Lang): string {
  return lang === "th" ? (WEEKDAY_TH[name] ?? name) : name;
}

export const DOW_KEYS: MsgKey[] = [
  "dowMon",
  "dowTue",
  "dowWed",
  "dowThu",
  "dowFri",
  "dowSat",
  "dowSun",
];
