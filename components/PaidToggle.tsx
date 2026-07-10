"use client";

import { useOptimistic, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setPaid } from "@/lib/actions/sessions";

export function PaidToggle({
  sessionId,
  paid,
}: {
  sessionId: string;
  paid: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [optimisticPaid, setOptimisticPaid] = useOptimistic(paid);

  function toggle() {
    startTransition(async () => {
      try {
        setOptimisticPaid(!optimisticPaid);
        const result = await setPaid(sessionId, !optimisticPaid);
        if (result.ok) {
          router.refresh();
        }
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
      {optimisticPaid ? "✓ Paid" : "Unpaid"}
    </button>
  );
}
