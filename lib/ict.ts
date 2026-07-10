// The owner lives in Thailand (ICT, UTC+7) and all stored dates are ICT
// wall-clock dates (kept as UTC date-only values). Vercel servers run in UTC,
// so a plain `new Date()` lags Thailand by 7 hours: between midnight and 7am
// ICT, "today" and "this month" would point at yesterday / last month.
// These helpers shift "now" so UTC getters read Thai wall-clock time.

const ICT_OFFSET_MS = 7 * 60 * 60 * 1000;

/** "Now" shifted so UTC getters (getUTCHours, toISOString, …) read ICT. */
export function ictNow(): Date {
  return new Date(Date.now() + ICT_OFFSET_MS);
}

/** Today's date in Thailand as YYYY-MM-DD. */
export function todayIct(): string {
  return ictNow().toISOString().slice(0, 10);
}

/** The current month in Thailand as YYYY-MM. */
export function currentMonthIct(): string {
  return todayIct().slice(0, 7);
}
