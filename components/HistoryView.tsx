"use client";

import { useOptimistic, type ReactNode } from "react";
import { UnpaidBanner } from "@/components/UnpaidBanner";
import { SessionsTable, type SessionRow } from "@/components/SessionsTable";
import {
  UnpaidSummaryContext,
  type SessionChange,
} from "@/components/UnpaidSummaryContext";
import type { Lang } from "@/lib/i18n";

export function HistoryView({
  sessions,
  unpaidTotal,
  unpaidCount,
  lang,
  emptyMessage,
  filterBar,
}: {
  sessions: SessionRow[];
  unpaidTotal: number;
  unpaidCount: number;
  lang: Lang;
  emptyMessage?: string;
  filterBar?: ReactNode;
}) {
  const [unpaid, applyDelta] = useOptimistic(
    { total: unpaidTotal, count: unpaidCount },
    (cur, delta: { amount: number; count: number }) => ({
      total: cur.total + delta.amount,
      count: cur.count + delta.count,
    }),
  );

  function onSessionChange(sessionId: string, change: SessionChange) {
    const session = sessions.find((s) => s.id === sessionId);
    if (!session) return;
    if (change === "paid") {
      applyDelta({ amount: -session.totalBaht, count: -1 });
    } else if (change === "unpaid") {
      applyDelta({ amount: session.totalBaht, count: 1 });
    } else if (!session.paid) {
      applyDelta({ amount: -session.totalBaht, count: -1 });
    }
  }

  return (
    <UnpaidSummaryContext.Provider value={onSessionChange}>
      <div className="mb-3">
        <UnpaidBanner unpaidTotal={unpaid.total} unpaidCount={unpaid.count} />
      </div>
      {filterBar}
      <SessionsTable
        sessions={sessions}
        allowDelete
        lang={lang}
        emptyMessage={emptyMessage}
      />
    </UnpaidSummaryContext.Provider>
  );
}
