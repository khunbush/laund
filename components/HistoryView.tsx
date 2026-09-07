"use client";

import { useOptimistic, type ReactNode } from "react";
import { UnpaidBanner } from "@/components/UnpaidBanner";
import { SessionsTable, type SessionRow } from "@/components/SessionsTable";
import {
  UnpaidSummaryContext,
  type SessionChange,
} from "@/components/UnpaidSummaryContext";
import { computeSmallCoinTotal } from "@/lib/denominations";
import type { Lang } from "@/lib/i18n";

export function HistoryView({
  sessions,
  unpaidTotal,
  unpaidCount,
  unpaidExclCoins,
  unpaidSmallCoins,
  lang,
  emptyMessage,
  filterBar,
}: {
  sessions: SessionRow[];
  unpaidTotal: number;
  unpaidCount: number;
  unpaidExclCoins: number;
  unpaidSmallCoins: number;
  lang: Lang;
  emptyMessage?: string;
  filterBar?: ReactNode;
}) {
  const [unpaid, applyDelta] = useOptimistic(
    {
      total: unpaidTotal,
      count: unpaidCount,
      exclCoins: unpaidExclCoins,
      smallCoins: unpaidSmallCoins,
    },
    (
      cur,
      delta: {
        amount: number;
        amountExclCoins: number;
        amountSmallCoins: number;
        count: number;
      },
    ) => ({
      total: cur.total + delta.amount,
      count: cur.count + delta.count,
      exclCoins: cur.exclCoins + delta.amountExclCoins,
      smallCoins: cur.smallCoins + delta.amountSmallCoins,
    }),
  );

  function onSessionChange(sessionId: string, change: SessionChange) {
    const session = sessions.find((s) => s.id === sessionId);
    if (!session) return;
    const smallCoins = computeSmallCoinTotal(session);
    const exclCoins = session.totalBaht - smallCoins;
    const remove = {
      amount: -session.totalBaht,
      amountExclCoins: -exclCoins,
      amountSmallCoins: -smallCoins,
      count: -1,
    };
    if (change === "paid") {
      applyDelta(remove);
    } else if (change === "unpaid") {
      applyDelta({
        amount: session.totalBaht,
        amountExclCoins: exclCoins,
        amountSmallCoins: smallCoins,
        count: 1,
      });
    } else if (!session.paid) {
      applyDelta(remove);
    }
  }

  return (
    <UnpaidSummaryContext.Provider value={onSessionChange}>
      <div className="mb-3">
        <UnpaidBanner
          unpaidTotal={unpaid.total}
          unpaidCount={unpaid.count}
          unpaidExclCoins={unpaid.exclCoins}
          unpaidSmallCoins={unpaid.smallCoins}
        />
      </div>
      {filterBar}
      <SessionsTable
        sessions={sessions}
        allowDelete
        lang={lang}
        emptyMessage={emptyMessage}
        initialCount={5}
      />
    </UnpaidSummaryContext.Provider>
  );
}
