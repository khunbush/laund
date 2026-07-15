import Link from "next/link";
import { formatBaht, isCoinsOnly } from "@/lib/denominations";
import { KIND_EMOJI, type SessionKindValue } from "@/lib/kinds";
import { KIND_KEYS, shortDateYear, t, type Lang } from "@/lib/i18n";
import { DeleteSessionButton } from "@/components/DeleteSessionButton";
import { DenomBreakdown } from "@/components/DenomBreakdown";
import { PaidToggle } from "@/components/PaidToggle";

export interface SessionRow {
  id: string;
  date: Date;
  totalBaht: number;
  kind: SessionKindValue;
  paid: boolean;
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


function denomSummary(session: SessionRow, lang: Lang) {
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
  return parts.join("  ·  ") || t(lang, "noDenoms");
}

export function SessionsTable({
  sessions,
  allowDelete = false,
  lang,
  emptyMessage,
}: {
  sessions: SessionRow[];
  allowDelete?: boolean;
  lang: Lang;
  emptyMessage?: string;
}) {
  if (sessions.length === 0) {
    return (
      <p className="rounded-2xl bg-brand-surface p-6 text-center text-sm text-brand-muted">
        {emptyMessage ?? t(lang, "noSessions")}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {sessions.map((session) => (
        <div
          key={session.id}
          className="rounded-2xl border border-black/5 bg-brand-surface p-4 transition-transform active:scale-[0.99]"
        >
          <Link
            href={`/sessions/${session.id}`}
            className="block"
            prefetch={true}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-sm font-semibold text-brand-navy">
                {/* Deterministic tables, not toLocaleDateString: this renders
                    client-side under HistoryView, where Node and browser ICU
                    disagree on th-TH and would break hydration. */}
                {shortDateYear(lang, session.date, true)}
              </p>
              <p className="shrink-0 font-serif text-2xl leading-6 font-normal text-brand-purple-dark">
                {formatBaht(session.totalBaht)}
              </p>
            </div>
          </Link>
          <DenomBreakdown summary={denomSummary(session, lang)} />
          <div className="mt-2.5 flex items-center gap-2">
            <span className="rounded-full bg-black/5 px-2.5 py-1 text-[11px] font-semibold text-brand-navy/70">
              {KIND_EMOJI[session.kind]} {t(lang, KIND_KEYS[session.kind])}
            </span>
            {session.kind === "LAUNDRY" && isCoinsOnly(session) && (
              <span className="rounded-full bg-black/5 px-2.5 py-1 text-[11px] font-semibold text-brand-navy/70">
                🪙 {t(lang, "coinsOnly")}
              </span>
            )}
            <PaidToggle sessionId={session.id} paid={session.paid} />
            <span className="flex-1" />
            {allowDelete && <DeleteSessionButton sessionId={session.id} />}
          </div>
        </div>
      ))}
    </div>
  );
}
