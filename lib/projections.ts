export interface ProjectionSession {
  date: Date;
  totalBaht: number;
}

export type ProjectionConfidence = "none" | "low" | "ok";

export interface Projections {
  avgPerSession: number | null;
  avgIntervalDays: number | null;
  projectedNextSessionAmount: number | null;
  projectedNextSessionDate: Date | null;
  actualCollectedThisMonth: number;
  projectedRemainingAmount: number | null;
  projectedMonthEndTotal: number;
  confidence: ProjectionConfidence;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / MS_PER_DAY);
}

// UTC getters: `today` arrives ICT-shifted (see lib/ict.ts) and session dates
// are stored as UTC date-only values, so month boundaries must be UTC too.
function startOfMonth(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

function endOfMonth(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0));
}

/**
 * Sessions must be sorted ascending by date. Only the trailing `trailingWindow`
 * sessions are used for the average/interval calculations.
 */
export function computeProjections(
  sessions: ProjectionSession[],
  today: Date,
  trailingWindow = 10,
): Projections {
  const windowSessions = sessions.slice(-trailingWindow);
  const count = windowSessions.length;

  const confidence: ProjectionConfidence =
    count < 3 ? "none" : count < 5 ? "low" : "ok";

  const monthStart = startOfMonth(today);
  const actualCollectedThisMonth = sessions
    .filter((s) => s.date >= monthStart && s.date <= today)
    .reduce((sum, s) => sum + s.totalBaht, 0);

  if (count === 0) {
    return {
      avgPerSession: null,
      avgIntervalDays: null,
      projectedNextSessionAmount: null,
      projectedNextSessionDate: null,
      actualCollectedThisMonth,
      projectedRemainingAmount: null,
      projectedMonthEndTotal: actualCollectedThisMonth,
      confidence,
    };
  }

  const avgPerSession =
    windowSessions.reduce((sum, s) => sum + s.totalBaht, 0) / count;

  let avgIntervalDays: number | null = null;
  if (count >= 2) {
    const gaps: number[] = [];
    for (let i = 1; i < windowSessions.length; i++) {
      gaps.push(
        Math.max(1, daysBetween(windowSessions[i - 1].date, windowSessions[i].date)),
      );
    }
    avgIntervalDays = gaps.reduce((a, b) => a + b, 0) / gaps.length;
  }

  const lastSession = windowSessions[windowSessions.length - 1];
  const projectedNextSessionDate = avgIntervalDays
    ? new Date(lastSession.date.getTime() + avgIntervalDays * MS_PER_DAY)
    : null;

  let projectedRemainingAmount: number | null = null;
  if (avgIntervalDays) {
    const daysRemainingInMonth = Math.max(
      0,
      daysBetween(today, endOfMonth(today)),
    );
    const expectedRemainingSessions = Math.floor(
      daysRemainingInMonth / avgIntervalDays,
    );
    projectedRemainingAmount = expectedRemainingSessions * avgPerSession;
  }

  const projectedMonthEndTotal =
    actualCollectedThisMonth + (projectedRemainingAmount ?? 0);

  return {
    avgPerSession,
    avgIntervalDays,
    projectedNextSessionAmount: avgPerSession,
    projectedNextSessionDate,
    actualCollectedThisMonth,
    projectedRemainingAmount,
    projectedMonthEndTotal,
    confidence,
  };
}
