"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { clearMachineBranch } from "@/app/compare/actions";

export function ClearMachineButton({ branch }: { branch: number }) {
  const router = useRouter();
  const [armed, setArmed] = useState(false);
  const [pending, startTransition] = useTransition();
  const disarm = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (armed) disarm.current = setTimeout(() => setArmed(false), 3000);
    return () => {
      if (disarm.current) clearTimeout(disarm.current);
    };
  }, [armed]);

  function handleClick() {
    if (!armed) {
      setArmed(true);
      return;
    }
    startTransition(async () => {
      try {
        const result = await clearMachineBranch(branch);
        if (result.ok) router.refresh();
        else setArmed(false);
      } catch {
        setArmed(false);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      aria-label={armed ? "Confirm clear" : `Clear branch ${branch} data`}
      className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-semibold transition-all duration-150 active:scale-95 disabled:opacity-50 ${
        armed
          ? "bg-brand-orange text-white shadow-md shadow-brand-orange/30"
          : "bg-black/5 text-brand-muted"
      }`}
    >
      {pending ? "Clearing…" : armed ? "Sure? Tap again" : "Clear"}
    </button>
  );
}
