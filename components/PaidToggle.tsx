"use client";

import { useOptimistic, useTransition } from "react";
import { setPaid } from "@/lib/actions/sessions";
import { useT } from "@/components/I18nProvider";
import { useUnpaidSummaryNotify } from "@/components/UnpaidSummaryContext";

export function PaidToggle({
  sessionId,
  paid,
}: {
  sessionId: string;
  paid: boolean;
}) {
  const { t } = useT();
  const notifyUnpaidSummary = useUnpaidSummaryNotify();
  const [pending, startTransition] = useTransition();
  const [optimisticPaid, setOptimisticPaid] = useOptimistic(paid);

  function toggle() {
    const next = !optimisticPaid;
    startTransition(async () => {
      try {
        setOptimisticPaid(next);
        notifyUnpaidSummary?.(sessionId, next ? "paid" : "unpaid");
        // setPaid revalidates this route, so the fresh page ships back in the
        // action response itself — no follow-up refresh needed.
        await setPaid(sessionId, next);
      } catch {
        // Optimistic state auto-reverts when the transition ends without a
        // committed refresh; nothing else to do.
      }
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-label={optimisticPaid ? "Mark as unpaid" : "Mark as paid"}
      className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-bold transition-all active:scale-95 disabled:opacity-60 ${
        optimisticPaid
          ? "bg-brand-green/15 text-brand-green-dark"
          : "bg-brand-purple/15 text-brand-purple-dark"
      }`}
    >
      {optimisticPaid ? t("paid") : t("unpaid")}
    </button>
  );
}
