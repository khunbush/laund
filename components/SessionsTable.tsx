import Link from "next/link";
import { formatBaht } from "@/lib/denominations";
import { DeleteSessionButton } from "@/components/DeleteSessionButton";

export interface SessionRow {
  id: string;
  date: Date;
  totalBaht: number;
  note1000: number;
  note500: number;
  note100: number;
  note50: number;
  note20: number;
  coin10: number;
  coin5: number;
  coin2: number;
  coin1: number;
}

function formatDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function denomSummary(session: SessionRow) {
  const parts: string[] = [];
  const entries: [string, number][] = [
    ["1000", session.note1000],
    ["500", session.note500],
    ["100", session.note100],
    ["50", session.note50],
    ["20", session.note20],
    ["10", session.coin10],
    ["5", session.coin5],
    ["2", session.coin2],
    ["1", session.coin1],
  ];
  for (const [label, count] of entries) {
    if (count > 0) parts.push(`${count}×฿${label}`);
  }
  return parts.join("  ·  ") || "No denominations recorded";
}

export function SessionsTable({
  sessions,
  allowDelete = false,
}: {
  sessions: SessionRow[];
  allowDelete?: boolean;
}) {
  if (sessions.length === 0) {
    return (
      <p className="rounded-2xl bg-brand-surface p-6 text-center text-sm text-brand-muted">
        No sessions yet. Log your first collection from Home.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {sessions.map((session) => (
        <div
          key={session.id}
          className="flex items-center gap-2 rounded-2xl border border-black/5 bg-brand-surface p-4 transition-transform duration-150 active:scale-[0.99]"
        >
          <Link
            href={`/sessions/${session.id}`}
            className="min-w-0 flex-1"
            prefetch={true}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-brand-navy">
                {formatDate(session.date)}
              </p>
              <p className="text-lg font-bold text-brand-purple-dark">
                {formatBaht(session.totalBaht)}
              </p>
            </div>
            <p className="mt-1 truncate text-xs text-brand-muted">
              {denomSummary(session)}
            </p>
          </Link>
          {allowDelete && <DeleteSessionButton sessionId={session.id} />}
        </div>
      ))}
    </div>
  );
}
