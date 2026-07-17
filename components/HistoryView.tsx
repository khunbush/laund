"use client";

import { useOptimistic, type ReactNode } from "react";
import { UnpaidBanner } from "@/components/UnpaidBanner";
import { SessionsTable, type SessionRow } from "@/components/SessionsTable";
import {
  UnpaidSummaryContext,
  type SessionChange,
} from "@/components/UnpaidSummaryContext";
import { computeCoinTotal } from "@/lib/denominations";
import type { Lang } from "@/lib/i18n";

export function HistoryView({
  sessions,
  unpaidTotal,
  unpaidCount,
  unpaidExclCoins,
  lang,
  emptyMessage,
  filterBar,
}: {
  sessions: SessionRow[];
  unpaidTotal: number;
  unpaidCount: number;
  unpaidExclCoins: number;
  lang: Lang;
  emptyMessage?: string;
  filterBar?: ReactNode;
}) {
  const [unpaid, applyDelta] = useOptimistic(
    { total: unpaidTotal, count: unpaidCount, exclCoins: unpaidExclCoins },
    (cur, delta: { amount: number; amountExclCoins: number; count: number }) => ({
      total: cur.total + delta.amount,
      count: cur.count + delta.count,
      exclCoins: cur.exclCoins + delta.amountExclCoins,
    }),
  );

  function onSessionChange(sessionId: string, change: SessionChange) {
    const session = sessions.find((s) => s.id === sessionId);
    if (!session) return;
    const exclCoins = session.totalBaht - computeCoinTotal(session);
    if (change === "paid") {
      applyDelta({ amount: -session.totalBaht, amountExclCoins: -exclCoins, count: -1 });
    } else if (change === "unpaid") {
      applyDelta({ amount: session.totalBaht, amountExclCoins: exclCoins, count: 1 });
    } else if (!session.paid) {
      applyDelta({ amount: -session.totalBaht, amountExclCoins: -exclCoins, count: -1 });
    }
  }

  return (
    <UnpaidSummaryContext.Provider value={onSessionChange}>
      <div className="mb-3">
        <UnpaidBanner
          unpaidTotal={unpaid.total}
          unpaidCount={unpaid.count}
          unpaidExclCoins={unpaid.exclCoins}
        />
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
