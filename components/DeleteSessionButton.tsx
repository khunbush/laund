"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteSession } from "@/lib/actions/sessions";

export function DeleteSessionButton({
  sessionId,
  redirectTo,
}: {
  sessionId: string;
  redirectTo?: string;
}) {
  const router = useRouter();
  const [armed, setArmed] = useState(false);
  const [pending, startTransition] = useTransition();
  const disarmTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-disarm after 3s so a stray first tap can't linger.
  useEffect(() => {
    if (armed) {
      disarmTimer.current = setTimeout(() => setArmed(false), 3000);
    }
    return () => {
      if (disarmTimer.current) clearTimeout(disarmTimer.current);
    };
  }, [armed]);

  function handleClick() {
    if (!armed) {
      setArmed(true);
      return;
    }
    startTransition(async () => {
      const result = await deleteSession(sessionId);
      if (!result.ok) return;
      if (redirectTo) {
        router.push(redirectTo);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      aria-label={armed ? "Confirm delete" : "Delete session"}
      className={`shrink-0 rounded-full px-3.5 py-2 text-xs font-semibold transition-all duration-150 active:scale-95 disabled:opacity-50 ${
        armed
          ? "bg-brand-orange text-white shadow-md shadow-brand-orange/30"
          : "bg-black/5 text-brand-muted"
      }`}
    >
      {pending ? "Deleting…" : armed ? "Sure? Tap again" : "Delete"}
    </button>
  );
}
