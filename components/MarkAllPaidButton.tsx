"use client";

import { useEffect, useRef, useState } from "react";
import { useT } from "@/components/I18nProvider";

/** Two-tap "Sure? Tap again" confirm, then marks every unpaid session paid. */
export function MarkAllPaidButton({
  onConfirm,
  pending,
}: {
  onConfirm: () => void;
  pending: boolean;
}) {
  const { t } = useT();
  const [armed, setArmed] = useState(false);
  const disarm = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (armed) disarm.current = setTimeout(() => setArmed(false), 3000);
    return () => {
      if (disarm.current) clearTimeout(disarm.current);
    };
  }, [armed]);

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (armed) {
          setArmed(false);
          onConfirm();
        } else {
          setArmed(true);
        }
      }}
      className={`w-full rounded-full px-4 py-2 text-xs font-semibold transition-all active:scale-[0.98] disabled:opacity-60 ${
        armed
          ? "bg-brand-green text-white"
          : "bg-brand-green/15 text-brand-green-dark"
      }`}
    >
      {pending ? t("markingPaid") : armed ? t("sureTapAgain") : `✓ ${t("markAllPaid")}`}
    </button>
  );
}
